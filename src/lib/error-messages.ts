/**
 * 백엔드 에러 코드 → 프론트 노출 메시지 매핑
 * @see docs/ERROR_CODES.md
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Common
  COMMON_INVALID_EMAIL: '이메일 형식이 올바르지 않습니다.',

  // Account
  ACCOUNT_EMAIL_ALREADY_REGISTERED: '이미 가입된 이메일입니다.',
  ACCOUNT_NOT_FOUND: '계정을 찾을 수 없습니다.',
  ACCOUNT_INVALID_NAME: '이름이 올바르지 않습니다.',
  ACCOUNT_INVALID_DISPLAY_NAME: '표시 이름이 올바르지 않습니다.',
  ACCOUNT_INVALID_CREDENTIALS: '인증 정보가 올바르지 않습니다.',
  ACCOUNT_INVALID_CONFIRMATION_TOKEN: '확인 토큰이 만료되었거나 올바르지 않습니다.',
  ACCOUNT_WITHDRAWAL_BLOCKED_BY_OWNED_WORKSPACE:
    '소유한 워크스페이스를 양도하거나 삭제한 후 탈퇴해 주세요.',

  // Auth
  AUTH_INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  AUTH_INVALID_REFRESH_TOKEN: '세션이 만료되었습니다. 다시 로그인해 주세요.',

  // Challenge (OTP)
  CHALLENGE_OTP_COOLDOWN_ACTIVE: 'OTP 재요청 전 잠시 기다려 주세요.',
  CHALLENGE_NOT_FOUND: '인증 요청을 찾을 수 없습니다.',
  CHALLENGE_EXPIRED: '인증 시간이 만료되었습니다. 다시 요청해 주세요.',
  CHALLENGE_MAX_ATTEMPTS_EXCEEDED: '시도 횟수를 초과했습니다. 다시 요청해 주세요.',
  CHALLENGE_INVALID_OTP: 'OTP 코드가 올바르지 않습니다.',

  // Message
  MESSAGE_REQUIRED_FIELD_MISSING: '필수 항목이 누락되었습니다.',
  MESSAGE_INVALID_PARAM: '요청 값이 올바르지 않습니다.',
  MESSAGE_INVALID_NUMBER_PARAM: '숫자 형식이 올바르지 않습니다.',
  MESSAGE_POSITIVE_NUMBER_REQUIRED: '양수만 입력 가능합니다.',
  MESSAGE_INVALID_UUID_PARAM: '잘못된 식별자입니다.',
  MESSAGE_INVALID_EMAIL_PARAM: '이메일 형식이 올바르지 않습니다.',
  MESSAGE_MAIL_UNSUPPORTED_TYPE: '지원하지 않는 메일 유형입니다.',
  MESSAGE_CHANNEL_NOT_SUPPORTED: '지원하지 않는 채널입니다.',
  MESSAGE_TOKEN_AUTH_NOT_SUPPORTED: '토큰 인증을 지원하지 않습니다.',
  MESSAGE_MAIL_TEMPLATE_NOT_FOUND: '메일 템플릿을 찾을 수 없습니다.',
  MESSAGE_MAIL_TEMPLATE_RENDER_FAILED: '메일 생성에 실패했습니다.',
  MESSAGE_MAIL_DUPLICATE_PENDING_AUTH_TOKEN: '이미 발송된 인증 메일이 있습니다.',

  // Project
  PROJECT_ID_NULL: '프로젝트 ID가 필요합니다.',
  PROJECT_NOT_FOUND: '프로젝트를 찾을 수 없습니다.',
  PROJECT_NAME_NULL: '프로젝트 이름이 필요합니다.',
  SAME_PROJECT: '동일한 프로젝트입니다.',

  // Task
  TASK_NOT_FOUND: '작업을 찾을 수 없습니다.',
  TASK_ID_NULL: '작업 ID가 필요합니다.',
  TITLE_NOT_VALID: '제목이 올바르지 않습니다.',
  DESCRIPTION_NOT_VALID: '설명이 올바르지 않습니다.',
  TASK_INFO_NOT_FOUND: '작업 정보를 찾을 수 없습니다.',
  INVALID_TRANSITION: '잘못된 상태 변경입니다.',
  INVALID_REQUEST: '잘못된 요청입니다.',

  // Workspace
  WORKSPACE_NOT_FOUND: '워크스페이스를 찾을 수 없습니다.',
  WORKSPACE_MEMBERSHIP_NOT_FOUND: '멤버십을 찾을 수 없습니다.',
  WORKSPACE_OWNER_REQUIRED: '워크스페이스 소유자만 가능합니다.',
  WORKSPACE_MEMBER_ALREADY_EXISTS: '이미 멤버로 등록되어 있습니다.',
  WORKSPACE_OWNER_REMOVAL_FORBIDDEN: '소유자는 제거할 수 없습니다.',
  WORKSPACE_TRANSFER_OWNERSHIP_FAILED: '소유권 양도에 실패했습니다.',
  WORKSPACE_ADD_MEMBER_FAILED: '멤버 추가에 실패했습니다.',
  WORKSPACE_REMOVE_MEMBER_FAILED: '멤버 제거에 실패했습니다.',
};

/** code 없을 때 status 기반 기본 메시지 */
const FALLBACK_BY_STATUS: Record<number, string> = {
  400: '입력값을 확인해 주세요.',
  401: '인증이 필요합니다.',
  403: '접근 권한이 없습니다.',
  404: '요청한 항목을 찾을 수 없습니다.',
  409: '충돌이 발생했습니다.',
  410: '만료된 요청입니다.',
  429: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  500: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
};

const DEFAULT_FALLBACK = '요청에 실패했습니다. 잠시 후 다시 시도해 주세요.';

/**
 * 에러 코드 또는 status로 사용자 노출 메시지 반환
 */
export function getErrorMessage(options: {
  code?: string | null;
  message?: string | null;
  status?: number;
}): string {
  const { code, message, status } = options;

  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }

  if (status && FALLBACK_BY_STATUS[status]) {
    return FALLBACK_BY_STATUS[status];
  }

  if (message && typeof message === 'string' && message.trim()) {
    return message;
  }

  return DEFAULT_FALLBACK;
}
