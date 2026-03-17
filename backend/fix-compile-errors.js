const fs = require('fs');

// 读取task.service.ts文件
let content = fs.readFileSync('src/modules/task/task.service.ts', 'utf8');

// 修复1: 确保addTags和setCategory方法在类内部且有正确缩进
// 查找remove方法的结束位置
const removeEndPattern = /async remove\(id: string\): Promise<void> \{[\s\S]*?\n  \}/;
const match = content.match(removeEndPattern);

if (match) {
  const removeEndIndex = content.indexOf(match[0]) + match[0].length;
  
  // 检查后面是否有类的结束}
  const afterRemove = content.substring(removeEndIndex);
  
  // 如果紧接着就是类结束，说明新方法在类外
  if (afterRemove.trim().startsWith('}')) {
    // 需要重新组织：删除类结束}，添加新方法，再添加类结束}
    
    // 提取remove方法之前的内容（不包括类结束}）
    const beforeRemove = content.substring(0, removeEndIndex);
    
    // 添加新方法
    const newMethods = `

  async addTags(id: string, tagIds: string[]): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['tags'],
    });
    if (!task) {
      throw new NotFoundException(\`Task with ID "\${id}" not found\`);
    }
    
    const tags = await this.dataSource.getRepository('Tag').findByIds(tagIds) as Tag[];
    task.tags = [...(task.tags || []), ...tags];
    
    return this.taskRepository.save(task);
  }

  async setCategory(id: string, categoryId: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['categories'],
    });
    if (!task) {
      throw new NotFoundException(\`Task with ID "\${id}" not found\`);
    }
    
    const category = await this.dataSource.getRepository('Category').findOne({ 
      where: { id: categoryId } 
    }) as Category;
    if (!category) {
      throw new NotFoundException(\`Category with ID "\${categoryId}" not found\`);
    }
    
    task.categories = [category];
    
    return this.taskRepository.save(task);
  }
}`;
    
    content = beforeRemove + newMethods;
    
    fs.writeFileSync('src/modules/task/task.service.ts', content, 'utf8');
    console.log('✅ task.service.ts修复完成');
  } else {
    console.log('⚠️ 文件结构已改变，跳过修复');
  }
} else {
  console.log('⚠️ 未找到remove方法，跳过修复');
}
