// API 서비스 함수들

export interface ParsedDocument {
  document_id: string;
  chunks: Array<{
    document_id: string;
    chunk_id: string;
    source: string;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const parseDocumentFromUrl = async (url: string): Promise<ApiResponse<ParsedDocument>> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30초 타임아웃으로 증가

    console.log('API 호출 시작:', url);
    
    const response = await fetch(`${API_BASE_URL_KINTEL}/parse-document-from-url/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('API 응답 받음:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('API 데이터 파싱 완료:', data);
    return {
      success: true,
      data: data as ParsedDocument,
    };
  } catch (error) {
    console.error('API 호출 오류:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'API 요청 시간이 초과되었습니다. 서버가 응답하지 않습니다.',
        };
      }
      if (error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: 'API 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.',
        };
      }
      return {
        success: false,
        error: error.message,
      };
    }
    
    return {
      success: false,
      error: '알 수 없는 오류가 발생했습니다.',
    };
  }
};

export const searchDocuments = async (query: string): Promise<ApiResponse<any>> => {
  try {
    const response = await fetch(`${API_BASE_URL_KINTEL}/search/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('검색 API 호출 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '검색 중 오류가 발생했습니다.',
    };
  }
};

const API_BASE_URL_KINTEL = '/api/kintel';
const API_BASE_URL_MODELS = '/api/models';

// 이미지 처리 API
export const processImage = async (file: File): Promise<ApiResponse<any>> => {
  try {
    console.log('이미지 처리 시작:', file.name);
    
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL_KINTEL}/process-image/`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('이미지 처리 성공:', data);
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('이미지 처리 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '이미지 처리 중 오류가 발생했습니다.',
    };
  }
};

// 질문 생성 API
export const generateQuestions = async (chunks: Array<{document_id: string, chunk_id: string, source: string}>): Promise<ApiResponse<any>> => {
  try {
    console.log('질문 생성 시작, 청크 수:', chunks.length);
    
    const response = await fetch(`${API_BASE_URL_KINTEL}/generate-questions/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chunks),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('질문 생성 성공:', data);
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('질문 생성 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '질문 생성 중 오류가 발생했습니다.',
    };
  }
};

// 문서 요약 API
export const generateSummary = async (text: string): Promise<ApiResponse<any>> => {
  try {
    console.log('문서 요약 생성 시작, 텍스트 길이:', text.length);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120초 타임아웃
    
    const response = await fetch(`${API_BASE_URL_MODELS}/summarization`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ context: text }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.status === 'success') {
      console.log('문서 요약 생성 성공:', result.data);
      return {
        success: true,
        data: result.data,
      };
    } else {
      throw new Error(result.msg || '요약 생성 실패');
    }
  } catch (error) {
    console.error('문서 요약 생성 오류:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: '요약 생성 시간이 초과되었습니다. 요약 서버가 응답하지 않습니다.',
        };
      }
      if (error.message.includes('Failed to fetch')) {
        return {
          success: false,
          error: '요약 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.',
        };
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '문서 요약 생성 중 오류가 발생했습니다.',
    };
  }
};

// 문서 처리 API (PDF, HWP 등)
export const processDocumentWithQuestions = async (file: File): Promise<ApiResponse<any>> => {
  try {
    console.log('문서 처리 시작:', file.name, '타입:', file.type);
    
    const formData = new FormData();
    formData.append('file', file);

    let endpoint = '/parse-document/';
    if (file.name.toLowerCase().endsWith('.hwp')) {
      endpoint = '/parse-document-hwp/';
    }

    const response = await fetch(`${API_BASE_URL_KINTEL}${endpoint}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('문서 처리 성공:', data);
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('문서 처리 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '문서 처리 중 오류가 발생했습니다.',
    };
  }
};

// FAQ 답변 생성 API
export const generateFaqAnswer = async (question: string, context: string): Promise<ApiResponse<any>> => {
  try {
    console.log('FAQ 답변 생성 시작:', question);
    
    const response = await fetch(`${API_BASE_URL_MODELS}/faq_answer_model`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, context }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('FAQ 답변 생성 성공');
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('FAQ 답변 생성 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'FAQ 답변 생성 중 오류가 발생했습니다.',
    };
  }
};

// Intent 분류 API
export const getIntent = async (question: string, context: string): Promise<ApiResponse<any>> => {
  try {
    console.log('Intent 분류 시작:', question);
    
    const response = await fetch(`${API_BASE_URL_MODELS}/intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        query: question,
        context: context 
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Intent 분류 완료:', data);
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Intent 분류 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Intent 분류 중 오류가 발생했습니다.',
    };
  }
};

// 일반 채팅 API
export const getChatResponse = async (question: string, context?: string): Promise<ApiResponse<any>> => {
  try {
    console.log('일반 채팅 응답 생성 시작:', question);
    
    const response = await fetch(`${API_BASE_URL_MODELS}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, context }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('일반 채팅 응답 생성 완료');
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('일반 채팅 응답 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '채팅 응답 생성 중 오류가 발생했습니다.',
    };
  }
};

// 스마트 채팅 응답 API (Intent 기반 라우팅)
export const getSmartChatResponse = async (
  question: string, 
  context: string, 
  summary?: string
): Promise<ApiResponse<any>> => {
  try {
    console.log('스마트 채팅 시작:', question);
    
    // 1. Intent 분류
    const intentResult = await getIntent(question, context);
    if (!intentResult.success) {
      throw new Error(intentResult.error || 'Intent 분류 실패');
    }

    // API 응답 구조: { status: "success", msg: "success", data: true/false }
    const isDocumentRelated = intentResult.data?.data === true;
    console.log('Intent 분류 결과 - 문서 관련:', isDocumentRelated, '전체 응답:', intentResult.data);

    // 2. Intent 결과에 따라 다른 모델과 context 사용
    if (isDocumentRelated) {
      console.log('FAQ-A 모델 사용 (요약 context)');
      const faqContext = summary || context; // 요약이 있으면 요약 사용, 없으면 전체 context
      return await generateFaqAnswer(question, faqContext);
    } else {
      console.log('일반 채팅 모델 사용');
      return await getChatResponse(question, context);
    }
  } catch (error) {
    console.error('스마트 채팅 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '스마트 채팅 중 오류가 발생했습니다.',
    };
  }
};
