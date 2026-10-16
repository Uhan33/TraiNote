import { randomInt } from 'node:crypto';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// 6자리 영대문자·숫자 (대소문자 구분 없음 → 대문자 통일). 약 21억 조합, 중복은 DB unique 로 최종 방어
export const generateMemberCode = () => Array.from({ length: 6 }, () => CHARS[randomInt(CHARS.length)]).join('');

export const MEMBER_CODE_PATTERN = /^[A-Z0-9]{6}$/;
