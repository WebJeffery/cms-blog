// scripts/generate-api.js
const { generateApi } = require('swagger-typescript-api');
const path = require('path');
const fs = require('fs-extra');

// 配置常量
const CONFIG = {
  input: path.resolve(__dirname, '../../server/public/swagger.json'),
  output: path.resolve(__dirname, '../src'),
  templates: path.resolve(__dirname, '../node_modules/swagger-typescript-api/templates/base'),
};

// 生成 API 类型定义和客户端
async function generateApiTypes() {
  console.log('🚀 开始生成 TypeScript API 定义...');
  console.log(`📁 输入: ${CONFIG.input}`);
  console.log(`📁 输出: ${CONFIG.output}`);

  // 检查输入文件是否存在
  if (!fs.existsSync(CONFIG.input)) {
    console.error(`❌ Swagger JSON 文件不存在: ${CONFIG.input}`);
    process.exit(1);
  }

  try {
    // 确保输出目录存在
    fs.ensureDirSync(CONFIG.output);

    const result = await generateApi({
      input: CONFIG.input,
      output: CONFIG.output,
      templates: CONFIG.templates,
      cleanOutput: true,
      modular: true,
      httpClientType: 'axios',
      typePrefix: 'I',
      generateClient: true,
      hooks: {
        onPrepareConfig: (currentConfiguration) => {
          const config = currentConfiguration.config;
          config.fileNames.httpClient = 'HttpClient'; // 使用大驼峰命名
          return { ...currentConfiguration, config };
        },
      },
    });

    console.log('✅ TypeScript API 定义生成成功!');

    // 检查生成的文件
    const files = fs.readdirSync(CONFIG.output);
    console.log('📄 生成的文件:', files);

    // 后处理：组织文件和创建索引
    await organizeGeneratedFiles();

    return result;
  } catch (error) {
    console.error('❌ 生成 API 类型定义时出错:', error.message);
    process.exit(1);
  }
}

// 组织生成的文件到正确的文件夹结构
async function organizeGeneratedFiles() {
  const srcDir = CONFIG.output;

  // 检查生成的文件
  const files = fs.readdirSync(srcDir);

  // 创建必要的目录
  const apiDir = path.join(srcDir, 'api');
  const typesDir = path.join(srcDir, 'types');
  const utilsDir = path.join(srcDir, 'utils');

  fs.ensureDirSync(apiDir);
  fs.ensureDirSync(typesDir);
  fs.ensureDirSync(utilsDir);

  // 移动文件到正确的目录
  files.forEach((file) => {
    const filePath = path.join(srcDir, file);

    if (file.endsWith('.ts')) {
      // 根据文件名判断文件类型
      if (file === 'HttpClient.ts' || file === 'ApiClient.ts' || /[A-Z]/.test(file[0])) {
        // API 文件：首字母大写的文件或特定的客户端文件
        fs.moveSync(filePath, path.join(apiDir, file), { overwrite: true });
        console.log(`📄 移动 API 文件: ${file} -> api/`);
      } else if (file.includes('contract') || file === 'types.ts') {
        // 类型定义文件
        fs.moveSync(filePath, path.join(typesDir, file === 'types.ts' ? 'index.ts' : file), { overwrite: true });
        console.log(`📄 移动类型文件: {file} -> types/`);
      } else {
        // 其他文件留在根目录
        console.log(`📄 保留文件: {file}`);
      }
    }
  });

  // 修复 HttpClient 类的 securityWorker 属性
  await fixHttpClient();

  // 修复 API 文件中的导入路径
  await fixApiImports();

  // 重命名 API 方法，使其更专业
  await renameApiMethods();

  // 创建统一的类型索引
  await createTypeIndex();

  // 创建统一的 API 索引
  await createApiIndex();

  // 创建主入口文件
  await createMainIndex();

  // 创建 API 实例化文件
  await createApiInstance();

  // 生成工具函数
  await generateUtils();

  console.log('✅ 文件组织完成');
}

// 修复 HttpClient 类的 securityWorker 属性
async function fixHttpClient() {
  console.log('🔧 修复 HttpClient 类...');
  
  const httpClientPath = path.join(CONFIG.output, 'api', 'HttpClient.ts');
  
  if (fs.existsSync(httpClientPath)) {
    let content = fs.readFileSync(httpClientPath, 'utf8');
    
    // 将 private securityWorker 改为 public
    content = content.replace(/private securityWorker/, 'public securityWorker');
    
    // 重命名 ApiConfig 接口，避免冲突
    content = content.replace(/interface ApiConfig/, 'interface HttpClientConfig');
    content = content.replace(/ApiConfig<SecurityDataType>/g, 'HttpClientConfig<SecurityDataType>');
    
    // 添加默认导出
    if (!content.includes('export default HttpClient')) {
      content += '\n\nexport default HttpClient;\n';
    }
    
    fs.writeFileSync(httpClientPath, content);
    console.log('✅ HttpClient 修复完成');
  } else {
    console.log('⚠️  HttpClient.ts 文件不存在，跳过修复');
  }
}

// 修复 API 文件中的导入路径
async function fixApiImports() {
  console.log('🔧 修复 API 文件中的导入路径...');
  
  const apiDir = path.join(CONFIG.output, 'api');
  
  // 获取所有 API 文件
  const apiFiles = fs.readdirSync(apiDir).filter(file => file.endsWith('.ts') && file !== 'index.ts');
  
  for (const file of apiFiles) {
    const filePath = path.join(apiDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 修复导入路径
    content = content.replace(
      /from '\.\/data-contracts'/g,
      "from '../types/data-contracts'"
    );
    
    // 修复 HttpClient 导入路径
    content = content.replace(
      /from '\.\/httpClient'/g,
      "from './HttpClient'"
    );
    
    // 修复其他可能的类型导入
    content = content.replace(
      /from '\.\/([^']+)'/g,
      (match, importPath) => {
        // 如果导入路径是类型文件，则重定向到 types 目录
        if (importPath.includes('contract') || importPath === 'types') {
          return `from '../types/${importPath}'`;
        }
        return match;
      }
    );
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, content);
    console.log(`✅ 修复 ${file} 的导入路径`);
  }
  
  console.log('✅ 所有 API 文件的导入路径已修复');
}

// 重命名 API 方法，使其更专业
async function renameApiMethods() {
  console.log('🔧 重命名 API 方法...');
  
  const apiDir = path.join(CONFIG.output, 'api');
  
  // 获取所有 API 文件
  const apiFiles = fs.readdirSync(apiDir).filter(file => 
    file.endsWith('.ts') && 
    file !== 'index.ts' && 
    file !== 'HttpClient.ts' &&
    /[A-Z]/.test(file[0]) // 首字母大写的文件
  );
  
  for (const file of apiFiles) {
    const filePath = path.join(apiDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 使用更精确的正则表达式匹配并重命名方法
    // 匹配模式: 方法名以 Controller 开头，后面跟着大写字母
    // 例如: articleControllerFindById -> findById
    content = content.replace(
      /(\w+)Controller([A-Z]\w+)/g,
      (match, className, methodName) => {
        // 将方法名的首字母小写
        const newMethodName = methodName.charAt(0).toLowerCase() + methodName.slice(1);
        return newMethodName;
      }
    );
    
    // 写入修复后的内容
    fs.writeFileSync(filePath, content);
    console.log(`✅ 重命名 ${file} 中的方法`);
  }
  
  console.log('✅ 所有 API 方法已重命名');
}

// 创建统一的类型索引
async function createTypeIndex() {
  console.log('📝 创建统一的类型索引...');
  
  const typesDir = path.join(CONFIG.output, 'types');
  
  // 获取所有类型文件
  const typeFiles = fs.readdirSync(typesDir).filter(file => file.endsWith('.ts') && file !== 'index.ts');
  
  let indexContent = '// 类型定义索引\n// 自动生成，请勿手动修改\n\n';
  
  // 添加所有类型文件的导出
  typeFiles.forEach(file => {
    const moduleName = file.replace('.ts', '');
    indexContent += `export * from './${moduleName}';\n`;
  });
  
  // 写入索引文件
  fs.writeFileSync(path.join(typesDir, 'index.ts'), indexContent);
  console.log('✅ 类型索引文件已创建');
}

// 创建统一的 API 索引
async function createApiIndex() {
  console.log('📝 创建统一的 API 索引...');
  
  const apiDir = path.join(CONFIG.output, 'api');
  
  // 获取所有 API 文件
  const apiFiles = fs.readdirSync(apiDir).filter(file => file.endsWith('.ts') && file !== 'index.ts' && file !== 'ApiInstance.ts');
  
  let indexContent = '// API 客户端索引\n// 自动生成，请勿手动修改\n\n';
  
  // 添加所有 API 文件的导出
  apiFiles.forEach(file => {
    const moduleName = file.replace('.ts', '');
    indexContent += `export * from './${moduleName}';\n`;
  });
  
  // 添加 HttpClient 导出
  indexContent += `\nexport { default as HttpClient } from './HttpClient';\n`;
  indexContent += `export type { HttpClientConfig } from './HttpClient';\n`;
  
  // 写入索引文件
  fs.writeFileSync(path.join(apiDir, 'index.ts'), indexContent);
  console.log('✅ API 索引文件已创建');
}

// 创建主入口文件
async function createMainIndex() {
  console.log('📝 创建主入口文件...');
  
  const mainIndexContent = `// Auto-generated API client
// Generated from Swagger/OpenAPI specification

// 导出 API 实例
export { default as api } from './api/ApiInstance';
export * from './api/ApiInstance';

// 导出类型定义
export * as types from './types';

// 导出工具函数
export * as utils from './utils';

// 默认导出 API 实例
export { default } from './api/ApiInstance';
`;

  fs.writeFileSync(path.join(CONFIG.output, 'index.ts'), mainIndexContent);
  console.log('✅ 主入口文件已创建');
}

// 创建 API 实例化文件
async function createApiInstance() {
  console.log('📝 创建 API 实例化文件...');
  
  const apiDir = path.join(CONFIG.output, 'api');
  
  // 获取所有 API 文件（排除 index.ts 和 HttpClient.ts）
  const apiFiles = fs.readdirSync(apiDir).filter(file => 
    file.endsWith('.ts') && 
    file !== 'index.ts' && 
    file !== 'HttpClient.ts' && 
    file !== 'ApiInstance.ts' &&
    /[A-Z]/.test(file[0]) // 首字母大写的文件
  );
  
  // 提取 API 类名（去掉 .ts 后缀）
  const apiClassNames = apiFiles.map(file => file.replace('.ts', ''));
  
  // 生成导入语句
  const imports = apiClassNames.map(className => 
    `import { ${className} } from './${className}';`
  ).join('\n');
  
  // 生成实例化语句
  const instances = apiClassNames.map(className => {
    const instanceName = className.charAt(0).toLowerCase() + className.slice(1);
    return `  ${instanceName}: new ${className}(config),`;
  }).join('\n');
  
  // 生成类型定义
  const types = apiClassNames.map(className => {
    const instanceName = className.charAt(0).toLowerCase() + className.slice(1);
    return `  ${instanceName}: ${className}<SecurityDataType>;`;
  }).join('\n');
  
  const apiInstanceContent = `// API 实例化文件
// 自动生成，请勿手动修改

import { HttpClient, HttpClientConfig } from './HttpClient';
${imports}

export interface ApiConfig<SecurityDataType = unknown> extends HttpClientConfig<SecurityDataType> {
  // 可以添加额外的配置项
}

export interface ApiInstance<SecurityDataType = unknown> {
${types}
}

/**
 * 创建 API 实例
 * @param config API 配置
 * @returns API 实例对象
 */
export function createApiInstance<SecurityDataType = unknown>(
  config: ApiConfig<SecurityDataType> = {}
): ApiInstance<SecurityDataType> {
  const httpClient = new HttpClient<SecurityDataType>(config);
  
  return {
${instances}
  };
}

// 默认 API 实例
export const api = createApiInstance();

export default api;
`;

  // 使用大驼峰命名
  fs.writeFileSync(path.join(apiDir, 'ApiInstance.ts'), apiInstanceContent);
  console.log('✅ API 实例化文件已创建');
  
  // 更新 API 索引文件，添加对 ApiInstance.ts 的导出
  const apiIndexPath = path.join(apiDir, 'index.ts');
  let apiIndexContent = fs.readFileSync(apiIndexPath, 'utf8');
  
  apiIndexContent += '\n// API 实例化\nexport * from \'./ApiInstance\';\n';
  apiIndexContent += 'export { default as api } from \'./ApiInstance\';\n';
  
  fs.writeFileSync(apiIndexPath, apiIndexContent);
  console.log('✅ 更新 API 索引文件');
}

// 生成工具函数
async function generateUtils() {
  const utilsDir = path.join(CONFIG.output, 'utils');
  fs.ensureDirSync(utilsDir);

  // HTTP 客户端配置 - 修复类型错误
  const httpUtilsContent = `import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// 创建自定义 axios 实例
export const createHttpClient = (baseURL?: string) => {
  const instance = axios.create({
    baseURL: baseURL || process.env.API_BASE_URL || 'http://localhost:3002',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器 - 修复类型错误
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // 添加认证令牌
      const token = localStorage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = \`Bearer \${token}\`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response.data;
    },
    (error) => {
      // 统一错误处理
      if (error.response?.status === 401) {
        // 未授权处理
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
      return Promise.reject(error.response?.data || error);
    }
  );

  return instance;
};

// 默认 HTTP 客户端实例
export const httpClient = createHttpClient();

export default httpClient;
`;

  // 通用工具函数
  const commonUtilsContent = `// 通用工具函数

// 日期格式化
export const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day);
};

// 深度克隆
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
};

// API 响应处理
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

// 分页响应
export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 错误处理
export class ApiError extends Error {
  constructor(
    public code: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
  
  // 检查是否为 ApiError 实例
  static isInstance(error: any): error is ApiError {
    return error instanceof ApiError;
  }
}
`;

  // 工具索引文件
  const utilsIndexContent = `// 工具函数索引
// 自动生成，请勿手动修改

export * from './http';
export * from './common';
`;

  // 写入工具函数
  const httpUtilsPath = path.join(utilsDir, 'http.ts');
  const commonUtilsPath = path.join(utilsDir, 'common.ts');
  const utilsIndexPath = path.join(utilsDir, 'index.ts');
  
  // 检查文件是否存在，避免覆盖可能的自定义修改
  if (!fs.existsSync(httpUtilsPath)) {
    fs.writeFileSync(httpUtilsPath, httpUtilsContent);
  }
  
  if (!fs.existsSync(commonUtilsPath)) {
    fs.writeFileSync(commonUtilsPath, commonUtilsContent);
  }
  
  if (!fs.existsSync(utilsIndexPath)) {
    fs.writeFileSync(utilsIndexPath, utilsIndexContent);
  }

  console.log('📄 工具函数生成完成');
}

// 执行生成
generateApiTypes()
  .then(() => {
    console.log('🎉 API 生成过程完成!');
    console.log('📁 生成的文件结构:');
    console.log('  - src/api/           # API 客户端');
    console.log('  - src/api/ApiInstance.ts # API 实例化文件');
    console.log('  - src/api/HttpClient.ts  # HTTP 客户端');
    console.log('  - src/types/         # 类型定义');
    console.log('  - src/utils/         # 工具函数');
    console.log('  - src/index.ts       # 主入口文件');
    console.log('');
    console.log('💡 使用方法:');
    console.log('  1. 直接使用默认实例:');
    console.log('     import api from \'@fe/toolkit\';');
    console.log('     api.article.findById();');
    console.log('');
    console.log('  2. 导入所有模块:');
    console.log('     import { api, types, utils } from \'@fe/toolkit\';');
    console.log('     const articles = await api.article.findAll();');
    console.log('     const formattedDate = utils.formatDate(new Date());');
    console.log('     const articleType: types.IArticle = { ... };');
  })
  .catch((error) => {
    console.error('❌ API 生成过程失败:', error.message);
    process.exit(1);
  });