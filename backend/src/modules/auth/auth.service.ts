import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { RegisterDto, LoginDto, AuthResponseDto } from './dto/auth.dto';

// 防暴力破解配置
interface LoginAttempt {
  count: number;
  lockUntil: number | null;
}

@Injectable()
export class AuthService {
  // 内存缓存：记录登录失败次数
  private loginAttempts: Map<string, LoginAttempt> = new Map();
  private readonly MAX_LOGIN_ATTEMPTS = 5; // 最大失败次数
  private readonly LOCK_TIME = 15 * 60 * 1000; // 锁定时间：15分钟

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name } = registerDto;

    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already registered');
    }

    // Generate username from email
    const username = await this.generateUsername(email);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      displayName: name,
      username, // 添加自动生成的username
    });

    await this.userRepository.save(user);

    // Generate tokens
    const accessToken = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        role: user.role,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // 检查是否被锁定
    const attempt = this.loginAttempts.get(email);
    if (attempt && attempt.lockUntil && Date.now() < attempt.lockUntil) {
      const remainingTime = Math.ceil((attempt.lockUntil - Date.now()) / 60000);
      throw new UnauthorizedException(
        `账户已被锁定，请${remainingTime}分钟后再试`
      );
    }

    // Find user
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      this.recordFailedAttempt(email);
      throw new UnauthorizedException('用户名或密码错误，请重试');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.recordFailedAttempt(email);
      throw new UnauthorizedException('用户名或密码错误，请重试');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('账号已被禁用，请联系管理员');
    }

    // 登录成功，清除失败记录
    this.loginAttempts.delete(email);

    // Generate tokens
    const accessToken = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName,
        role: user.role,
      },
    };
  }

  /**
   * 记录登录失败尝试
   */
  private recordFailedAttempt(email: string): void {
    const attempt = this.loginAttempts.get(email) || { count: 0, lockUntil: null };
    attempt.count += 1;

    // 超过阈值，锁定账户
    if (attempt.count >= this.MAX_LOGIN_ATTEMPTS) {
      attempt.lockUntil = Date.now() + this.LOCK_TIME;
    }

    this.loginAttempts.set(email, attempt);
  }

  async validateUser(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  async validateUserByEmail(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * 从email生成唯一的username
   * 使用email前缀（@符号前的部分）
   * 如果重复，添加数字后缀
   */
  private async generateUsername(email: string): Promise<string> {
    // 提取email前缀（@符号前的部分）
    const baseUsername = email.split('@')[0].toLowerCase();
    
    // 检查username是否已存在
    let username = baseUsername;
    let counter = 1;
    
    while (await this.userRepository.findOne({ where: { username } })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    
    return username;
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, { expiresIn: '7d' });
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.displayName,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // 验证refresh token
      const payload = this.jwtService.verify(refreshToken);
      
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('无效的刷新令牌');
      }
      
      // 查找用户
      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      
      if (!user || !user.isActive) {
        throw new UnauthorizedException('用户不存在或已被禁用');
      }
      
      // 生成新的access token和refresh token
      const newAccessToken = this.generateToken(user);
      const newRefreshToken = this.generateRefreshToken(user);
      
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.displayName,
          role: user.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  /**
   * 登出（在JWT无状态架构中，主要是客户端删除token）
   * 这里可以实现token黑名单机制（如果需要服务端失效）
   */
  async logout(userId: string): Promise<{ message: string }> {
    // 在无状态JWT架构中，登出主要是客户端行为
    // 如果需要服务端失效，可以在这里实现token黑名单
    // 目前返回成功消息
    return {
      message: '登出成功',
    };
  }

  /**
   * 获取登录尝试次数
   * 用于前端检查账户是否被锁定
   */
  async getLoginAttempts(email: string): Promise<{
    email: string;
    attempts: number;
    maxAttempts: number;
    isLocked: boolean;
    lockUntil: number | null;
  }> {
    const attempt = this.loginAttempts.get(email);

    return {
      email,
      attempts: attempt?.count || 0,
      maxAttempts: this.MAX_LOGIN_ATTEMPTS,
      isLocked: !!(attempt && attempt.lockUntil && Date.now() < attempt.lockUntil),
      lockUntil: attempt?.lockUntil || null,
    };
  }

  /**
   * 忘记密码 - 发送密码重置邮件
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    // 1. 检查用户是否存在
    const user = await this.userRepository.findOne({ where: { email } });
    
    if (!user) {
      // 为了安全，即使用户不存在也返回成功消息
      // 防止通过此接口探测用户邮箱
      console.log(`[forgotPassword] Email not found: ${email}`);
      return {
        message: '如果该邮箱已注册，您将收到密码重置邮件',
      };
    }

    // 2. 生成随机 token（32 字节，转换为十六进制字符串）
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 3. 设置过期时间（1 小时后）
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // 4. 保存到数据库
    const passwordResetToken = this.passwordResetTokenRepository.create({
      email,
      token: resetToken,
      expiresAt,
      isUsed: false,
    });

    await this.passwordResetTokenRepository.save(passwordResetToken);

    // 5. 发送邮件（暂时使用控制台日志）
    // TODO: 配置 SMTP 服务器后，替换为实际邮件发送
    const resetLink = `http://localhost:3002/reset-password?token=${resetToken}`;
    console.log(`[forgotPassword] Password reset link for ${email}:`);
    console.log(`[forgotPassword] ${resetLink}`);
    console.log(`[forgotPassword] Token expires at: ${expiresAt.toISOString()}`);

    return {
      message: '如果该邮箱已注册，您将收到密码重置邮件',
    };
  }

  /**
   * 重置密码 - 使用 token 重置用户密码
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // 1. 查找 token
    const passwordResetToken = await this.passwordResetTokenRepository.findOne({
      where: { token },
    });

    if (!passwordResetToken) {
      throw new UnauthorizedException('无效的重置链接');
    }

    // 2. 检查 token 是否已使用
    if (passwordResetToken.isUsed) {
      throw new UnauthorizedException('该重置链接已被使用');
    }

    // 3. 检查 token 是否过期
    const now = new Date();
    if (passwordResetToken.expiresAt < now) {
      throw new UnauthorizedException('重置链接已过期，请重新申请');
    }

    // 4. 查找用户
    const user = await this.userRepository.findOne({
      where: { email: passwordResetToken.email },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 5. 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 6. 更新用户密码
    user.password = hashedPassword;
    await this.userRepository.save(user);

    // 7. 标记 token 为已使用
    passwordResetToken.isUsed = true;
    await this.passwordResetTokenRepository.save(passwordResetToken);

    console.log(`[resetPassword] Password reset successful for user: ${user.email}`);

    return {
      message: '密码重置成功，请使用新密码登录',
    };
  }
}
