/** 하위 주소 배포(basePath)를 고려한 정적 파일 경로 */
export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const asset = (p: string) => BASE + p;
