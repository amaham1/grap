// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

// Prevent multiple Prisma Client instances in development hot-reloads
// https://pris.ly/d/help/next-js-best-practices
const globalForPrisma = global as unknown as { prisma?: any }; // 타입을 any로 변경

// 데이터베이스 연결 문자열 처리
let databaseUrl = process.env.DATABASE_URL || '';

// 이미 쿼리 파라미터가 있는지 확인
const hasQuery = databaseUrl.includes('?');

// SSL 비활성화 및 기타 파라미터 추가
const connectionParams = [
  'ssl={"rejectUnauthorized":false}',
  'sslmode=prefer',
  'timezone=Asia/Seoul',
  'connection_limit=5',
  'connect_timeout=10'
].join('&');

// 데이터베이스 URL에 파라미터 추가
databaseUrl += hasQuery ? '&' + connectionParams : '?' + connectionParams;

// 암호화/복호화 키 설정
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key-here';
const ENCRYPTION_IV = process.env.ENCRYPTION_IV || 'your-16-char-iv';

// base64 디코딩 함수 (더 강력한 검증 추가)
const decodeBase64 = (str: string): string => {
  // 빈 문자열이거나 null/undefined인 경우 그대로 반환
  if (!str) return str;
  
  try {
    // base64 문자열이 유효한지 확인
    if (typeof str !== 'string') return str;
    
    // base64 문자열 패턴 확인 (A-Z, a-z, 0-9, +, /, =)
    const base64Regex = /^[A-Za-z0-9+/=]+$/;
    if (!base64Regex.test(str)) return str;
    
    // 길이가 4의 배수인지 확인 (base64 문자열의 특징)
    if (str.length % 4 !== 0) return str;
    
    // 디코딩 시도
    const decoded = Buffer.from(str, 'base64').toString('utf8');
    
    // 디코딩된 결과가 유효한지 확인 (비어있지 않은 문자열인지)
    return decoded || str;
  } catch (error) {
    console.error('Base64 디코딩 오류:', error);
    return str; // 디코딩 실패 시 원본 문자열 반환
  }
};

// 복호화 함수
const decrypt = (text: string): string => {
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = Buffer.alloc(16, ENCRYPTION_IV);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(text, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('복호화 오류:', error);
    return text; // 복호화 실패 시 원본 문자열 반환
  }
};

// Prisma 클라이언트 생성
const prismaClient = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  // 타입스크립트 오류를 피하기 위해 any 타입으로 캐스팅
} as any);

// 미들웨어 추가: 쿼리 결과 후처리
prismaClient.$use(async (params, next) => {
  // 쿼리 실행 전 로깅 (디버깅용)
  console.log(`[Prisma Query] Model: ${params.model}, Action: ${params.action}`);
  
  try {
    const result = await next(params);
    
    // 결과가 없거나 배열이 아닌 경우 처리하지 않음
    if (!result) return result;
    
    // 복호화가 필요한 모델 목록
    const modelsToDecrypt = ['JejuEvent', 'WelfareService'];
    
    // 현재 모델이 복호화가 필요한지 확인
    if (params.model && modelsToDecrypt.includes(params.model)) {
      // 단일 객체인 경우 배열로 변환하여 처리
      const records = Array.isArray(result) ? result : [result];
      
      // 각 레코드의 필드 복호화
      const decryptedRecords = records.map(record => {
        if (!record) return record;
        
        const decryptedRecord = { ...record };
        
        // 복호화가 필요한 필드 목록 (모델별로 조정 필요)
        const fieldsToDecrypt = ['title', 'name', 'contents'];
        
        // 각 필드에 대해 복호화 시도
        fieldsToDecrypt.forEach(field => {
          if (field in decryptedRecord && decryptedRecord[field] !== null && decryptedRecord[field] !== undefined) {
            try {
              // 필드 값이 문자열인지 확인
              if (typeof decryptedRecord[field] === 'string') {
                // base64 디코딩 시도
                const decoded = decodeBase64(decryptedRecord[field]);
                
                // 디코딩된 결과가 원본과 다르다면 (디코딩 성공)
                if (decoded !== decryptedRecord[field]) {
                  decryptedRecord[field] = decoded;
                }
              }
            } catch (error) {
              console.error(`필드 복호화 오류 (${field}):`, error);
              // 오류가 발생해도 계속 진행
            }
          }
        });
        
        return decryptedRecord;
      });
      
      // 원래 결과가 배열이 아니었다면 첫 번째 요소 반환
      return Array.isArray(result) ? decryptedRecords : decryptedRecords[0];
    }
    
    return result;
  } catch (error) {
    console.error('[Prisma Middleware Error]', error);
    throw error; // 오류를 다시 던져서 호출자에게 전달
  }
});

export const prisma = globalForPrisma.prisma ?? prismaClient;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
