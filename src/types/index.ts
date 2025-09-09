// 개선된 타입 정의 - K-Intelligence
import React from 'react';

// 파싱된 청크 정보
export interface ParsedChunk {
  document_id: string;
  chunk_id: string;
  source: string;
}

// 파싱된 문서 정보
export interface ParsedDocument {
  document_id: string;
  chunks: ParsedChunk[];
}

// 이미지 처리 결과
export interface ProcessedImage {
  text?: string;
  analysis?: any;
  confidence?: number;
  [key: string]: any;
}

// 질문 생성 요청 인터페이스
export interface QuestionGenerationRequest {
  document_id: string;
  chunk_id: string;
  source: string;
}

// 생성된 질문
export interface GeneratedQuestion {
  question: string;
  chunk_id?: string;
  document_id?: string;
  answer?: string;
  questionIndex?: number;
  confidence?: number;
  category?: string;
}

// API 응답용 질문 형식
export interface ApiGeneratedQuestion {
  midm_questions: string;
}

// 질문 생성 응답
export interface QuestionGenerationResponse {
  document_id: string;
  chunk_id: string;
  questions: ApiGeneratedQuestion[];
}

// 문서 입력 타입
export interface DocumentInput {
  id: string;
  type: 'document' | 'image' | 'link';
  title: string;
  content: string;
  url?: string;
  imageUrl?: string; // 이미지 미리보기용 base64 URL
  uploadedAt: Date;
  parsedData?: ParsedDocument;
  imageAnalysis?: ProcessedImage;
  generatedQuestions?: GeneratedQuestion[];
  chunkMapping?: { [questionIndex: number]: { chunk_id: string; source: string } }; // 질문-청크 매핑
  summary?: string; // 문서 요약
  fileSize?: number;
  fileType?: string;
  processingTime?: number;
  status?: 'processing' | 'completed' | 'error';
  error?: string;
}

// FAQ 항목
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  relevance?: number;
  createdAt?: Date;
}

// 채팅 메시지
export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'text' | 'image' | 'file' | 'system';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
  };
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  timestamp?: string;
}

// 헬스 체크 응답
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version?: string;
  uptime?: number;
  memory?: {
    used: number;
    total: number;
  };
}

// 파일 처리 상태
export type FileProcessingStatus = 'idle' | 'uploading' | 'parsing' | 'analyzing' | 'generating' | 'completed' | 'error';

// 지원되는 파일 타입
export type SupportedFileType = 
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp'
  | 'application/pdf'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.hancom.hwp'
  | 'text/plain'
  | 'text/markdown';

// 파일 감지 결과
export interface FileDetectionResult {
  type: 'image' | 'document' | 'hwp' | 'text' | 'unsupported';
  mimeType: string;
  extension: string;
  size: number;
  isSupported: boolean;
  maxSizeLimit: number;
}

// 처리 옵션
export interface ProcessingOptions {
  generateQuestions?: boolean;
  questionCount?: number;
  chunkSize?: number;
  language?: 'ko' | 'en' | 'auto';
  timeout?: number;
}

// 통계 정보
export interface UsageStats {
  totalDocuments: number;
  totalQuestions: number;
  totalUsers: number;
  avgProcessingTime: number;
  popularFileTypes: { [key: string]: number };
}

// 추천 콘텐츠
export interface RecommendedContent {
  id: string;
  title: string;
  description: string;
  views: number;
  type: 'document' | 'image' | 'link';
  icon: React.ReactElement;
  category: string;
  url?: string;
  sampleText?: string;
  filePath?: string;
}

// 검색 결과
export interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: 'document' | 'image' | 'link';
  relevanceScore: number;
  highlights: string[];
  createdAt: Date;
}

// 검색 쿼리
export interface SearchQuery {
  query: string;
  filters?: {
    type?: DocumentInput['type'][];
    dateRange?: {
      start: Date;
      end: Date;
    };
    minRelevance?: number;
  };
  pagination?: {
    page: number;
    limit: number;
  };
  sortBy?: 'relevance' | 'date' | 'title';
  sortOrder?: 'asc' | 'desc';
}

// 오류 타입
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userFriendly: boolean;
}

// 시스템 알림
export interface SystemNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  dismissed: boolean;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

// 사용자 설정
export interface UserPreferences {
  language: 'ko' | 'en';
  theme: 'light' | 'dark' | 'auto';
  defaultProcessingOptions: ProcessingOptions;
  notifications: {
    processingComplete: boolean;
    errors: boolean;
    systemUpdates: boolean;
  };
  autoSave: boolean;
}

// 앱 상태
export interface AppState {
  isLoading: boolean;
  currentDocument?: DocumentInput;
  processingStatus: FileProcessingStatus;
  apiStatus: {
    isOnline: boolean;
    lastChecked: Date | null;
    message: string;
    latency?: number;
  };
  notifications: SystemNotification[];
  preferences: UserPreferences;
  stats: UsageStats;
}

// 컴포넌트 Props 타입들
export interface HomePageProps {
  onDocumentCreate?: (document: DocumentInput) => void;
}

export interface DocumentDetailProps {
  document: DocumentInput;
  onEdit?: (document: DocumentInput) => void;
  onDelete?: (documentId: string) => void;
}

export interface ChatProps {
  document: DocumentInput;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}

export interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedTypes: string;
  maxSize: number;
  multiple?: boolean;
  disabled?: boolean;
}

// 유틸리티 타입들
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// 상수들
export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  DOCUMENT: 50 * 1024 * 1024, // 50MB
  TEXT: 1 * 1024 * 1024, // 1MB
} as const;

export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png', 
  'image/gif',
  'image/webp',
] as const;

export const SUPPORTED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.hancom.hwp',
] as const;

export const SUPPORTED_TEXT_TYPES = [
  'text/plain',
  'text/markdown',
] as const;

export const API_ENDPOINTS = {
  HEALTH: '/',
  PARSE_DOCUMENT: '/parse-document/',
  PARSE_DOCUMENT_HWP: '/parse-document-hwp/',
  PARSE_DOCUMENT_FROM_URL: '/parse-document-from-url/',
  PROCESS_IMAGE: '/process-image/',
  GENERATE_QUESTIONS: '/generate-questions/',
  SEARCH: '/search/',
} as const;

export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
  PARSING_ERROR: 'PARSING_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

// 타입 가드 함수들
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

export const isDocumentFile = (file: File): boolean => {
  return SUPPORTED_DOCUMENT_TYPES.includes(file.type as any) || 
         file.name.toLowerCase().endsWith('.hwp');
};

export const isTextFile = (file: File): boolean => {
  return SUPPORTED_TEXT_TYPES.includes(file.type as any);
};

export const isSupportedFile = (file: File): boolean => {
  return isImageFile(file) || isDocumentFile(file) || isTextFile(file);
};

export const getMaxFileSize = (file: File): number => {
  if (isImageFile(file)) return FILE_SIZE_LIMITS.IMAGE;
  if (isDocumentFile(file)) return FILE_SIZE_LIMITS.DOCUMENT;
  if (isTextFile(file)) return FILE_SIZE_LIMITS.TEXT;
  return 0;
};

// 기본 내보내기
export default {
  FILE_SIZE_LIMITS,
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_DOCUMENT_TYPES,
  SUPPORTED_TEXT_TYPES,
  API_ENDPOINTS,
  ERROR_CODES,
  isImageFile,
  isDocumentFile,
  isTextFile,
  isSupportedFile,
  getMaxFileSize,
};