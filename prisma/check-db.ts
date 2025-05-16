import { PrismaClient } from '@prisma/client';

interface QueryResult {
  count: number;
}

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('데이터베이스 연결을 확인 중입니다...');
    
    // 데이터베이스 연결 테스트
    await prisma.$connect();
    console.log('✅ 데이터베이스에 성공적으로 연결되었습니다.');
    
    // 각 테이블의 데이터 개수 확인
    console.log('\n테이블 데이터 조회 중...');
    
    // 각 테이블 조회
    const [exhibitions, welfare, events] = await Promise.all([
      prisma.$queryRaw<QueryResult[]>`SELECT COUNT(*) as count FROM external_exhibition`,
      prisma.$queryRaw<QueryResult[]>`SELECT COUNT(*) as count FROM welfare_service`,
      prisma.$queryRaw<QueryResult[]>`SELECT COUNT(*) as count FROM jeju_event`
    ]);
    
    console.log('\n📊 테이블별 레코드 수:');
    console.log('------------------------');
    console.log('external_exhibition 테이블 레코드 수:', exhibitions[0]?.count || 0);
    console.log('welfare_service 테이블 레코드 수:', welfare[0]?.count || 0);
    console.log('jeju_event 테이블 레코드 수:', events[0]?.count || 0);
    
    // 테이블 스키마 확인
    console.log('\n🔍 테이블 스키마 확인:');
    console.log('------------------------');
    
    const tableNames = await prisma.$queryRaw<
      { table_name: string }[]
    >`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    
    console.log('사용 가능한 테이블 목록:');
    tableNames.forEach(({ table_name }) => {
      console.log(`- ${table_name}`);
    });
    
    return true;
  } catch (error) {
    console.error('\n❌ 데이터베이스 연결 실패:', error);
    
    // 더 자세한 오류 정보 출력
    if (error instanceof Error) {
      console.error('오류 이름:', error.name);
      console.error('오류 메시지:', error.message);
      console.error('스택 트레이스:', error.stack);
    }
    
    // 환경변수 확인
    console.log('\n🔍 환경변수 확인:');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '설정됨' : '설정되지 않음');
    
    return false;
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 데이터베이스 연결을 종료합니다.');
  }
}

// IIFE를 사용한 비동기 실행
(async () => {
  try {
    const success = await checkDatabase();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('스크립트 실행 중 오류 발생:', error);
    process.exit(1);
  }
})();
