import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Eye, FileText, Loader2, X, AlertCircle, CheckCircle, Link, Search } from 'lucide-react';
import { DocumentInput, ParsedChunk, RecommendedContent } from '../types/index';
import './HomePage.css';

import * as api from '../services/api';

// 파일 타입 감지 함수
const detectFileType = (file: File): 'image' | 'document' => {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return imageTypes.includes(file.type) ? 'image' : 'document';
};

// 파일 타입 아이콘 함수는 아래쪽에 더 상세한 버전이 있음


interface LoadingState {
  isLoading: boolean;
  step: string;
  progress?: number;
}

interface ApiStatus {
  isOnline: boolean;
  lastChecked: Date | null;
  message: string;
}

const HomePage: React.FC = () => {
  const [input, setInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [userCount, setUserCount] = useState(1234);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    step: '',
    progress: 0,
  });
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    isOnline: false,
    lastChecked: null,
    message: '상태 확인 중...'
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const recommendedContents: RecommendedContent[] = [
    // 지원/정책
    {
      id: '1',
      title: '지방재정경제실 민생회복 소비쿠폰 개요',
      description: '지방재정경제실',
      views: 2845,
      type: 'document',
      icon: <FileText size={16} />,
      category: '지원/정책',
      filePath: '/sample-files/민생회복 소비쿠폰 개요 자료.pdf'
    },
    {
      id: '2',
      title: '서울시 민생회복 소비쿠폰 종합 안내 및 신청 방법',
      description: '서울시청',
      views: 1567,
      type: 'link',
      icon: <Link size={16} />,
      category: '지원/정책',
      url: 'https://mediahub.seoul.go.kr/archives/2015048'
    },
    {
      id: '3',
      title: '천안시 민생회복 소비쿠폰 안내',
      description: '천안시청',
      views: 892,
      type: 'link',
      icon: <Link size={16} />,
      category: '지원/정책',
      url: 'https://www.cheonan.go.kr/kor/sub06_08_12.do'
    },
    // 입찰/계약
    {
      id: '4',
      title: '2025 캠퍼스타운 AI 임팩트 LAB 교육 운영',
      description: '교육부',
      views: 756,
      type: 'document',
      icon: <FileText size={16} />,
      category: '입찰/계약',
      filePath: '/sample-files/캠퍼스타운.pdf'
    },
    {
      id: '5',
      title: '피지컬AI 글로벌 얼라이언스 운영 용역',
      description: '과학기술정보통신부',
      views: 623,
      type: 'document',
      icon: <FileText size={16} />,
      category: '입찰/계약',
      filePath: '/sample-files/피지컬AI.pdf'
    },
    // 채용공고
    {
      id: '6',
      title: 'kt채용',
      description: 'KT',
      views: 445,
      type: 'image',
      icon: <FileText size={16} />,
      category: '채용공고',
      filePath: '/sample-files/kt채용.jpg'
    }
  ];

  const categories = ['전체', '지원/정책', '입찰/계약', '채용공고'];

  // 필터링된 콘텐츠
  const filteredContents = selectedCategory === '전체' 
    ? recommendedContents 
    : recommendedContents.filter(content => content.category === selectedCategory);

  // API 상태 체크 (임시 비활성화)
  const checkApi = async () => {
    try {
      // 임시로 항상 온라인으로 설정
      setApiStatus({
        isOnline: true,
        lastChecked: new Date(),
        message: '서버 연결 정상 (테스트 모드)'
      });
    } catch (error) {
      setApiStatus({
        isOnline: false,
        lastChecked: new Date(),
        message: '서버 상태 확인 실패'
      });
    }
  };

  // 사용자 수 시뮬레이션 및 API 상태 체크
  useEffect(() => {
    // 초기 API 상태 확인
    checkApi();

    // 정기적으로 API 상태 확인
    const apiCheckInterval = setInterval(checkApi, 30000); // 30초마다

    // 사용자 수 증가 시뮬레이션
    const userCountInterval = setInterval(() => {
      setUserCount(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);

    return () => {
      clearInterval(apiCheckInterval);
      clearInterval(userCountInterval);
    };
  }, []);

  // 알림 메시지 자동 삭제
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // URL 입력은 별도 버튼으로 처리하므로 항상 document로 처리
  const detectInputType = (value: string): 'document' => {
    return 'document';
  };

  const showError = (message: string) => {
    setError(message);
    setSuccess(null);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setError(null);
  };

  const setLoadingStep = (step: string, progress?: number) => {
    console.log('로딩 스텝 업데이트:', step, progress);
    setLoadingState(prev => ({
      ...prev,
      step,
      progress: progress || prev.progress,
    }));
  };

  const startLoading = (step: string) => {
    setLoadingState({
      isLoading: true,
      step,
      progress: 0,
    });
    setError(null);
    setSuccess(null);
  };

  const stopLoading = () => {
    setLoadingState({
      isLoading: false,
      step: '',
      progress: 0,
    });
  };

  const isValidUrl = (text: string): boolean => {
    try {
      // URL은 반드시 http:// 또는 https://로 시작하거나, www.으로 시작해야 함
      const trimmed = text.trim();
      
      // http:// 또는 https://로 시작하는 경우
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const url = new URL(trimmed);
        return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.');
      }
      
      // www.으로 시작하는 경우
      if (trimmed.startsWith('www.') && trimmed.includes('.')) {
        const url = new URL(`https://${trimmed}`);
        return url.hostname.includes('.');
      }
      
      // 도메인.확장자 형태인지 확인 (예: example.com)
      const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
      if (domainPattern.test(trimmed)) {
        const url = new URL(`https://${trimmed}`);
        return url.hostname.includes('.');
      }
      
      return false;
    } catch {
      return false;
    }
  };

  const processUrl = async (url: string) => {
    const documentId = Date.now().toString();
    
    console.log('URL 처리 시작:', url);
    
    startLoading('URL 분석 중...');
    
    try {
      setLoadingStep('URL에서 문서 파싱 중...', 25);
      const result = await api.parseDocumentFromUrl(url);
      
      if (result.success && result.data) {
        setLoadingStep('📝 자주 묻는 질문 생성 중... (조금만 기다려주세요)', 60);
        
        // 요약 생성
        let documentSummary = '';
        if (result.data.chunks && result.data.chunks.length > 0) {
          setLoadingStep('📋 문서 요약 생성 중...', 75);
          const fullText = result.data.chunks
            .map((chunk: any) => chunk.source)
            .join('\n\n')
            .trim();
            
          if (fullText.length > 0) {
            const summaryResult = await api.generateSummary(fullText);
            if (summaryResult.success && summaryResult.data) {
              documentSummary = summaryResult.data;
              console.log('URL 문서 요약 생성 성공:', documentSummary);
            } else {
              console.warn('URL 문서 요약 생성 실패:', summaryResult.error);
            }
          }
        }
        
        // URL에서 파싱된 문서로 질문 생성 (URL 파싱 API는 질문을 생성하지 않으므로 별도로 생성)
        setLoadingStep('📝 자주 묻는 질문 생성 중... (조금만 기다려주세요)', 60);
        const questionsResult = await api.generateQuestions(result.data.chunks);
        
        // 질문 평탄화
        const flattenedQuestions: Array<{question: string, chunk_id: string, document_id: string}> = [];
        const questionChunkMapping: Array<{chunk_id: string, source: string}> = [];
        
        if (questionsResult.success && questionsResult.data) {
          questionsResult.data.forEach((item: any) => {
            if (item.questions && Array.isArray(item.questions)) {
              item.questions.forEach((questionObj: any) => {
                if (questionObj.midm_questions) {
                  flattenedQuestions.push({
                    question: questionObj.midm_questions,
                    chunk_id: item.chunk_id,
                    document_id: item.document_id
                  });
                  
                  const correspondingChunk = result.data!.chunks.find((chunk: any) => chunk.chunk_id === item.chunk_id);
                  if (correspondingChunk) {
                    questionChunkMapping.push({
                      chunk_id: item.chunk_id,
                      source: correspondingChunk.source
                    });
                  }
                }
              });
            }
          });
        }
        
        if (flattenedQuestions.length === 0) {
          setLoadingStep('분석 완료', 100);
          showError('📝 링크의 내용이 부족하여 질문을 생성할 수 없습니다.\n더 자세한 내용이 포함된 다른 링크를 시도해주세요.');
          return;
        }
        
        const documentInput: DocumentInput = {
          id: documentId,
          type: 'link',
          title: `링크 분석: ${url}`,
          content: result.data!.chunks.map((chunk: any) => chunk.source).join('\n\n'),
          url: url,
          uploadedAt: new Date(),
          parsedData: result.data,
          generatedQuestions: flattenedQuestions,
          chunkMapping: questionChunkMapping,
          summary: documentSummary,
        };
        
        localStorage.setItem(`document_${documentId}`, JSON.stringify(documentInput));
        
        setLoadingStep('✅ 분석 완료!', 100);
        showSuccess('🎉 링크 분석이 완료되었습니다! 자주 묻는 질문과 요약을 확인해보세요.');
        
        setTimeout(() => {
          navigate(`/detail/${documentId}`);
        }, 500);
      } else {
        // 구체적인 에러 메시지 제공
        const errorMessage = result.error || '알 수 없는 오류';
        if (errorMessage.includes('HTTP 4') || errorMessage.includes('HTTP 5')) {
          showError(`⚠️ 링크에 접근할 수 없습니다. 올바른 링크인지 확인해주세요.\n링크: ${url}`);
        } else if (errorMessage.includes('timeout') || errorMessage.includes('TIMEOUT')) {
          showError(`⏱️ 링크 응답이 너무 오래 걸립니다. 다른 링크를 시도해보세요.\n링크: ${url}`);
        } else if (errorMessage.includes('NetworkError') || errorMessage.includes('Failed to fetch')) {
          showError(`🌐 네트워크 오류입니다. 인터넷 연결을 확인해주세요.\n링크: ${url}`);
        } else {
          showError(`❌ 이상한 링크입니다. 올바른 웹사이트 링크를 입력해주세요.\n오류: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('URL 처리 오류:', error);
      showError(`❌ 링크 처리 중 오류가 발생했습니다. 다른 링크를 시도해보세요.\n링크: ${url}`);
    } finally {
      stopLoading();
    }
  };

  const handleSubmit = async () => {
    // API 상태 확인
    if (!apiStatus.isOnline) {
      showError('API 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    // 파일이 선택되어 있으면 파일을 처리
    if (selectedFile) {
      await processFile(selectedFile);
      return;
    }

    // 텍스트 입력 처리
    if (!input.trim()) {
      showError('내용을 입력해주세요.');
      return;
    }

    // URL 감지 및 처리
    const inputText = input.trim();
    if (isValidUrl(inputText)) {
      await processUrl(inputText);
      return;
    }

    // 일반 텍스트 입력 처리 - 500자 기준 청킹 후 질문 생성까지 시도
    const documentId = Date.now().toString();
    
    startLoading('텍스트 분석 중...');
    
    try {
      // 텍스트를 500자 기준으로 청킹
      setLoadingStep('📄 문서 분석 중...', 25);
      const chunkSize = 500;
      const textChunks: ParsedChunk[] = [];
      
      if (inputText.length <= chunkSize) {
        // 500자 이하면 하나의 청크로
        textChunks.push({
          document_id: documentId,
          chunk_id: '0',
          source: inputText
        });
      } else {
        // 500자 초과시 청킹
        let currentIndex = 0;
        let chunkId = 0;
        
        while (currentIndex < inputText.length) {
          let endIndex = currentIndex + chunkSize;
          
          // 문장이 끊어지지 않도록 조정
          if (endIndex < inputText.length) {
            // 마침표, 느낌표, 물음표로 끝나는 지점 찾기
            const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];
            let bestEnd = endIndex;
            
            for (let i = endIndex; i > currentIndex + chunkSize * 0.7; i--) {
              const char = inputText.substring(i-1, i+1);
              if (sentenceEnders.some(ender => char === ender || inputText.substring(i-1, i+2) === ender)) {
                bestEnd = i;
                break;
              }
            }
            endIndex = bestEnd;
          }
          
          const chunkText = inputText.substring(currentIndex, endIndex).trim();
          if (chunkText.length > 0) {
            textChunks.push({
              document_id: documentId,
              chunk_id: chunkId.toString(),
              source: chunkText
            });
            chunkId++;
          }
          
          currentIndex = endIndex;
        }
      }
      
      console.log(`텍스트를 ${textChunks.length}개 청크로 분할:`, textChunks.map(chunk => `[${chunk.chunk_id}] ${chunk.source.substring(0, 50)}...`));
      
      setLoadingStep('📝 자주 묻는 질문 생성 중... (잠시만 기다려주세요)', 50);
      const questionsResult = await api.generateQuestions(textChunks);
      
      console.log('질문 생성 결과:', questionsResult);
      console.log('questionsResult.success:', questionsResult.success);
      console.log('questionsResult.data:', questionsResult.data);
      console.log('questionsResult.data.length:', questionsResult.data?.length);
      
      // API 호출 성공 여부만 먼저 확인
      if (!questionsResult.success || !questionsResult.data) {
        setLoadingStep('분석 완료', 100);
        showError('📝 질문 생성 API 호출에 실패했습니다.');
        return;
      }
      
      // API 응답에서 질문들을 평탄화하여 추출
      const flattenedQuestions: Array<{question: string, chunk_id: string, document_id: string}> = [];
      const questionChunkMapping: Array<{chunk_id: string, source: string}> = [];
      
      console.log('원본 API 응답:', questionsResult.data);
      
      if (questionsResult.data && Array.isArray(questionsResult.data)) {
        questionsResult.data.forEach((item: any, itemIndex: number) => {
          console.log(`API 응답 아이템 [${itemIndex}]:`, item);
          
          if (item.questions && Array.isArray(item.questions)) {
            item.questions.forEach((questionObj: any, questionIndex: number) => {
              console.log(`질문 객체 [${itemIndex}][${questionIndex}]:`, questionObj);
              
              // 더 관대한 질문 추출 로직
              let extractedQuestion = null;
              
              if (questionObj.midm_questions && typeof questionObj.midm_questions === 'string') {
                extractedQuestion = questionObj.midm_questions;
                console.log(`midm_questions 발견: ${extractedQuestion}`);
              } else if (questionObj.question && typeof questionObj.question === 'string') {
                extractedQuestion = questionObj.question;
                console.log(`question 발견: ${extractedQuestion}`);
              } else if (typeof questionObj === 'string') {
                extractedQuestion = questionObj;
                console.log(`직접 문자열 질문 발견: ${extractedQuestion}`);
              } else {
                console.log(`질문을 추출할 수 없음:`, questionObj);
              }
              
              if (extractedQuestion && extractedQuestion.trim()) {
                flattenedQuestions.push({
                  question: extractedQuestion.trim(),
                  chunk_id: item.chunk_id || 'unknown',
                  document_id: item.document_id || 'unknown'
                });
                
                console.log(`질문 추가됨: ${extractedQuestion.trim()}`);
                
                // 청크 매핑 정보 생성
                const correspondingChunk = textChunks.find(chunk => chunk.chunk_id === item.chunk_id);
                if (correspondingChunk) {
                  questionChunkMapping.push({
                    chunk_id: item.chunk_id,
                    source: correspondingChunk.source
                  });
                  console.log(`청크 매핑 추가: ${item.chunk_id}`);
                }
              }
            });
          } else {
            console.log(`questions 배열이 없음:`, item);
          }
        });
      } else {
        console.log(`questionsResult.data가 배열이 아님:`, questionsResult.data);
      }
      
      console.log('평탄화된 질문들:', flattenedQuestions);
      console.log('질문-청크 매핑:', questionChunkMapping);
      
      // 각 평탄화된 질문을 개별적으로 로깅
      flattenedQuestions.forEach((q, i) => {
        console.log(`평탄화된 질문 [${i}]:`, q);
      });
      
      // 평탄화 후 질문이 실제로 없으면 메시지 표시하고 리턴
      if (flattenedQuestions.length === 0) {
        setLoadingStep('분석 완료', 100);
        showError('📝 입력된 텍스트의 내용이 부족하여 질문을 생성할 수 없습니다.\n더 자세한 내용을 입력해주세요.');
        return;
      }
      
      // 요약 생성
      setLoadingStep('📋 문서 요약 생성 중...', 75);
      let documentSummary = '';
      const summaryResult = await api.generateSummary(inputText);
      if (summaryResult.success && summaryResult.data) {
        documentSummary = summaryResult.data;
      }

      const documentInput: DocumentInput = {
        id: documentId,
        type: 'document',
        title: '텍스트 분석',
        content: inputText,
        uploadedAt: new Date(),
        parsedData: {
          document_id: documentId,
          chunks: textChunks
        },
        generatedQuestions: flattenedQuestions,
        chunkMapping: questionChunkMapping,
        summary: documentSummary,
      };

      localStorage.setItem(`document_${documentId}`, JSON.stringify(documentInput));
      
      setLoadingStep('✅ 분석 완료!', 100);
      showSuccess('🎉 텍스트 분석이 완료되었습니다! 자주 묻는 질문과 요약을 확인해보세요.');
      
      setTimeout(() => {
        navigate(`/detail/${documentId}`);
      }, 500);
    } catch (error) {
      console.error('텍스트 처리 오류:', error);
      showError(`텍스트 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      stopLoading();
    }
  };

  const handleSearchSubmit = async () => {
    if (!searchInput.trim()) return;
    
    setShowSearchInput(false);
    startLoading('웹 검색 중...');
    
    try {
      setLoadingStep('검색 결과 찾는 중...', 50);
      
      // 프록시를 통해 SerpAPI 호출 (더 많은 결과 가져오기)
      const SERP_API_KEY = '58916791d803e313587e30c1a529acd6e64b9fd6e51104459425eeae6c576bf2';
      const url = `/api/serpapi/search.json?engine=google&q=${encodeURIComponent(searchInput.trim())}&api_key=${SERP_API_KEY}&num=5`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.organic_results && data.organic_results.length > 0) {
        setSearchResults(data.organic_results);
        setShowSearchResults(true);
        setLoadingStep('검색 완료!', 100);
      } else {
        setLoadingStep('검색 완료', 100);
        showError('🔍 검색 결과를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('검색 오류:', error);
      showError(`검색 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      stopLoading();
    }
  };

  const handleSearchResultSelect = async (link: string) => {
    setShowSearchResults(false);
    setSearchInput(''); // 검색어 초기화
    setSearchResults([]); // 검색 결과 초기화
    
    startLoading('선택한 링크 분석 중...');
    
    try {
      setLoadingStep('링크에서 문서 분석 중...', 50);
      await processUrl(link);
    } catch (error) {
      console.error('링크 처리 오류:', error);
      showError(`링크 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      stopLoading();
    }
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    
    setShowUrlInput(false);
    await processUrl(urlInput.trim());
    setUrlInput('');
  };

  const processFile = async (file: File) => {
    const documentId = Date.now().toString();
    const fileType = detectFileType(file);
    
    console.log('파일 처리 시작:', file.name, '타입:', fileType, '크기:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
    
    startLoading(`${fileType === 'image' ? '이미지' : '문서'} 분석 중...`);
    
    try {
      if (fileType === 'image') {
        setLoadingStep('이미지 분석 중...', 30);
        const result = await api.processImage(file);
        
        if (result.success && result.data) {
          setLoadingStep('텍스트 추출 중...', 60);
          
          // process-image API는 파싱된 문서 형식으로 반환
          const imageData = result.data as any;
          console.log('이미지 처리 결과:', imageData);
          
          // 질문 생성 (chunks가 있는 경우)
          let generatedQuestions: any = null;
          if (imageData.chunks && imageData.chunks.length > 0) {
            setLoadingStep('📝 자주 묻는 질문 생성 중... (시간이 조금 걸려요)', 80);
            
            // 청크에 텍스트가 충분하지 않으면 전체 텍스트를 하나의 청크로 만들어서 시도
            let chunksForQuestions = imageData.chunks;
            const hasEnoughText = imageData.chunks.some((chunk: any) => 
              chunk.source && chunk.source.trim().length > 10
            );
            
            if (!hasEnoughText && imageData.chunks.length > 0) {
              // 모든 청크의 텍스트를 합쳐서 하나의 청크로 만듦
              const combinedText = imageData.chunks
                .map((chunk: any) => chunk.source)
                .join(' ')
                .trim();
              
              if (combinedText.length > 0) {
                chunksForQuestions = [{
                  document_id: imageData.document_id + '_청크',
                  chunk_id: '0',
                  source: combinedText
                }];
              }
            }
            
            const questionsResult = await api.generateQuestions(chunksForQuestions);
            if (questionsResult.success && questionsResult.data) {
              console.log('원본 이미지 질문 API 응답:', questionsResult.data);
              
              // 이미지 처리에서도 텍스트와 동일한 평탄화 적용
              const imageFlattenedQuestions: Array<{question: string, chunk_id: string, document_id: string}> = [];
              const imageQuestionChunkMapping: Array<{chunk_id: string, source: string}> = [];
              
              if (questionsResult.data && Array.isArray(questionsResult.data)) {
                questionsResult.data.forEach((item: any) => {
                  if (item.questions && Array.isArray(item.questions)) {
                    item.questions.forEach((questionObj: any) => {
                      if (questionObj.midm_questions) {
                        imageFlattenedQuestions.push({
                          question: questionObj.midm_questions,
                          chunk_id: item.chunk_id,
                          document_id: item.document_id
                        });
                        
                        // 청크 매핑 정보 생성
                        const correspondingChunk = chunksForQuestions.find((chunk: any) => chunk.chunk_id === item.chunk_id);
                        if (correspondingChunk) {
                          imageQuestionChunkMapping.push({
                            chunk_id: item.chunk_id,
                            source: correspondingChunk.source
                          });
                        }
                      }
                    });
                  }
                });
              }
              
              console.log('이미지 평탄화된 질문들:', imageFlattenedQuestions);
              console.log('이미지 질문-청크 매핑:', imageQuestionChunkMapping);
              
              generatedQuestions = {
                questions: imageFlattenedQuestions,
                chunkMapping: imageQuestionChunkMapping
              };
            } else {
              console.warn('질문 생성 실패:', questionsResult.error);
              generatedQuestions = null; // 명시적으로 null 설정
            }
          }
          
          // 요약 생성
          let documentSummary = '';
          if (imageData.chunks && imageData.chunks.length > 0) {
            setLoadingStep('📋 문서 요약 생성 중...', 85);
            const fullText = imageData.chunks
              .map((chunk: any) => chunk.source)
              .join(' ')
              .trim();
              
            if (fullText.length > 0) {
              const summaryResult = await api.generateSummary(fullText);
              if (summaryResult.success && summaryResult.data) {
                documentSummary = summaryResult.data;
                console.log('생성된 요약:', documentSummary);
              } else {
                console.warn('요약 생성 실패:', summaryResult.error);
              }
            }
          }
          
          setLoadingStep('이미지 저장 중...', 90);
          
          // 이미지를 Base64로도 저장 (미리보기용)
          const reader = new FileReader();
          reader.onload = (e) => {
            const base64 = e.target?.result as string;
            
            // 파싱된 텍스트 내용 추출
            const extractedText = imageData.chunks ? 
              imageData.chunks.map((chunk: any) => chunk.source).join('\n\n') : 
              '';
            
            // 질문이 생성되지 않았으면 상세 페이지로 이동하지 않고 안내 메시지 표시
            console.log('이미지 처리 - 질문 검증:', generatedQuestions);
            const hasValidQuestions = generatedQuestions && 
                                    generatedQuestions.questions && 
                                    Array.isArray(generatedQuestions.questions) && 
                                    generatedQuestions.questions.length > 0;
            
            if (!hasValidQuestions) {
              setLoadingStep('분석 완료', 100);
              showError('📝 이미지에서 텍스트를 추출했지만 내용이 부족하여 질문을 생성할 수 없습니다.\n더 명확한 텍스트가 포함된 이미지를 업로드해주세요.');
              return;
            }
            
            const documentInput: DocumentInput = {
              id: documentId,
              type: 'image',
              title: file.name,
              content: extractedText || base64, // 추출된 텍스트가 있으면 사용, 없으면 base64
              imageUrl: base64, // 이미지 미리보기용
              uploadedAt: new Date(),
              parsedData: imageData, // 파싱된 데이터 저장
              generatedQuestions: generatedQuestions.questions, // 평탄화된 질문들만 저장
              chunkMapping: generatedQuestions.chunkMapping, // 청크 매핑 별도 저장
              summary: documentSummary, // 생성된 요약 저장
              imageAnalysis: result.data,
            };
            
            localStorage.setItem(`document_${documentId}`, JSON.stringify(documentInput));
            
            setLoadingStep('✅ 분석 완료!', 100);
            showSuccess('🎉 이미지 분석이 완료되었습니다! 자주 묻는 질문과 요약을 확인해보세요.');
            
            setTimeout(() => {
              navigate(`/detail/${documentId}`);
            }, 500);
          };
          
          reader.onerror = () => {
            showError('이미지 파일 읽기에 실패했습니다.');
          };
          
          reader.readAsDataURL(file);
        } else {
          showError(`이미지 처리에 실패했습니다: ${result.error || '알 수 없는 오류'}`);
        }
      } else {
        // 문서 파일 처리 (PDF, DOC, DOCX, HWP 등)
        setLoadingStep('문서 파싱 중...', 25);
        const result = await api.processDocumentWithQuestions(file);
        
        if (result.success && result.data) {
          console.log('문서 처리 API 응답:', result.data);
          setLoadingStep('📝 자주 묻는 질문 생성 중... (조금만 기다려주세요)', 60);
          
          // 요약 생성 - chunks 구조 확인
          let documentSummary = '';
          const chunks = result.data.chunks || result.data.document?.chunks || [];
          if (chunks && chunks.length > 0) {
            setLoadingStep('📋 문서 요약 생성 중...', 75);
            const fullText = chunks
              .map((chunk: any) => chunk.source)
              .join('\n\n')
              .trim();
              
            if (fullText.length > 0) {
              const summaryResult = await api.generateSummary(fullText);
              if (summaryResult.success && summaryResult.data) {
                documentSummary = summaryResult.data;
                console.log('문서 요약 생성 성공:', documentSummary);
              } else {
                console.warn('문서 요약 생성 실패:', summaryResult.error);
              }
            }
          }
          
          // 질문 생성 단계 추가
          setLoadingStep('📝 자주 묻는 질문 생성 중... (조금만 기다려주세요)', 85);
          const questionsResult = await api.generateQuestions(chunks);
          
          if (!questionsResult.success || !questionsResult.data) {
            setLoadingStep('분석 완료', 100);
            showError('📝 질문 생성 API 호출에 실패했습니다.');
            return;
          }
          
          // 질문 평탄화
          const flattenedQuestions: Array<{question: string, chunk_id: string, document_id: string}> = [];
          const questionChunkMapping: Array<{chunk_id: string, source: string}> = [];
          
          if (questionsResult.data && Array.isArray(questionsResult.data)) {
            questionsResult.data.forEach((item: any, index: any) => {
              if (item.questions && Array.isArray(item.questions)) {
                item.questions.forEach((questionObj: any) => {
                  if (questionObj.midm_questions) {
                    flattenedQuestions.push({
                      question: questionObj.midm_questions,
                      chunk_id: item.chunk_id,
                      document_id: item.document_id
                    });
                    questionChunkMapping.push({
                      chunk_id: item.chunk_id,
                      source: item.source || ''
                    });
                  }
                });
              }
            });
          }
          
          // 질문이 생성되지 않았으면 상세 페이지로 이동하지 않고 안내 메시지 표시
          if (flattenedQuestions.length === 0) {
            setLoadingStep('분석 완료', 100);
            showError('📝 내용이 부족하여 질문을 생성할 수 없습니다.\n더 자세한 내용이 포함된 파일을 업로드해주세요.');
            return;
          }
          
          const documentInput: DocumentInput = {
            id: documentId,
            type: 'document',
            title: file.name,
            content: chunks.map((chunk: any) => chunk.source).join('\n\n'),
            uploadedAt: new Date(),
            parsedData: result.data.document,
            generatedQuestions: flattenedQuestions, // 평탄화된 질문 사용
            chunkMapping: questionChunkMapping, // 질문-청크 매핑 저장
            summary: documentSummary,
          };
          
          localStorage.setItem(`document_${documentId}`, JSON.stringify(documentInput));
          
          setLoadingStep('✅ 분석 완료!', 100);
          showSuccess('🎉 문서 분석이 완료되었습니다! 자주 묻는 질문과 요약을 확인해보세요.');
          
          setTimeout(() => {
            navigate(`/detail/${documentId}`);
          }, 500);
        } else {
          showError(`파일 처리에 실패했습니다: ${result.error || '알 수 없는 오류'}`);
        }
      }
    } catch (error) {
      console.error('파일 처리 오류:', error);
      showError(`파일 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      stopLoading();
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setInput('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 검증 (50MB)
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        showError('파일 크기가 너무 큽니다. 최대 50MB까지 지원됩니다.');
        return;
      }
      
      setSelectedFile(file);
      setInput('');
      showSuccess(`파일 선택됨: ${file.name}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loadingState.isLoading) {
        handleSubmit();
      }
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileTypeIcon = (file: File) => {
    const fileType = detectFileType(file);
    const fileName = file.name.toLowerCase();
    
    if (fileType === 'image') return '🖼️';
    if (fileName.endsWith('.hwp')) return '📋';
    if (fileName.endsWith('.pdf')) return '📄';
    if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) return '📝';
    return '📄';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 콘텐츠 카드 클릭 핸들러
  const handleContentCardClick = async (content: RecommendedContent) => {
    if (loadingState.isLoading) return; // 이미 로딩 중이면 무시
    
    console.log('콘텐츠 카드 클릭:', content.title);
    
    if (content.type === 'link' && content.url) {
      // 링크 타입은 URL로 처리
      await processUrl(content.url);
    } else if (content.filePath) {
      try {
        // 파일을 fetch해서 File 객체로 변환
        const fileName = content.filePath.split('/').pop() || 'file';
        console.log(`파일 다운로드 시작: ${content.filePath}`);
        
        const response = await fetch(content.filePath);
        if (!response.ok) {
          throw new Error(`파일을 찾을 수 없습니다: ${fileName}`);
        }
        
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: blob.type });
        
        console.log(`파일 생성 완료: ${file.name}, 크기: ${file.size}bytes`);
        
        // 파일을 선택된 파일로 설정하고 처리
        setSelectedFile(file);
        showSuccess(`파일 "${fileName}"을 불러왔습니다. 분석을 시작합니다.`);
        
        // 자동으로 파일 처리 시작
        setTimeout(async () => {
          await processFile(file);
        }, 500);
        
      } catch (error) {
        console.error('파일 로드 오류:', error);
        const fileName = content.filePath.split('/').pop() || 'file';
        showError(`📁 "${fileName}" 파일을 불러올 수 없습니다.\n\n파일을 /public/sample-files/ 폴더에 넣어주세요.\n\n경로: ${content.filePath}`);
      }
    } else {
      showError('이 콘텐츠는 현재 분석할 수 없습니다.');
    }
  };

  return (
    <div className="home-page">

      {/* 알림 메시지 */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle size={16} />
          <span>{success}</span>
        </div>
      )}

      <div className="home-container">
        <div className="hero-section">
          <div className="mascot">💚</div>
          <h1>공고를 쉽게, 당신의 파트너쉽 '공고쉽'</h1>
        </div>

        <div 
          className={`input-section ${isDragging ? 'dragging' : ''} ${loadingState.isLoading ? 'loading' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {selectedFile ? (
            <div className="selected-file-display">
              <div className="file-icon">{getFileTypeIcon(selectedFile)}</div>
              <div className="file-info">
                <span className="file-name">{selectedFile.name}</span>
                <span className="file-size">{formatFileSize(selectedFile.size)}</span>
                <span className="file-type">{detectFileType(selectedFile)}</span>
              </div>
              <button 
                className="remove-file-btn" 
                onClick={removeSelectedFile}
                disabled={loadingState.isLoading}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="내용을 붙여넣거나, 파일을 업로드하거나, 링크를 입력하세요"
              className="main-input"
              disabled={loadingState.isLoading}
              rows={3}
            />
          )}
          
          {/* 진행률 표시 */}
          {loadingState.isLoading && loadingState.progress !== undefined && (
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${loadingState.progress}%` }}
              />
            </div>
          )}
          
          <div className="input-actions">
            {/* 파일 업로드 버튼 */}
            <div className="upload-button-wrapper">
              <button 
                className="action-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={loadingState.isLoading}
                title="파일 업로드"
              >
                <Upload size={18} />
              </button>
              <div className="tooltip">이미지, PDF, 워드, 한글파일 업로드</div>
            </div>
            
            {/* URL 버튼 */}
            <div className="url-button-wrapper">
              <button 
                className="action-btn"
                onClick={() => setShowUrlInput(!showUrlInput)}
                disabled={loadingState.isLoading}
                title="링크 입력"
              >
                <Link size={18} />
              </button>
              <div className="tooltip">링크 입력</div>
            </div>
            
            {/* 검색 버튼 */}
            <div className="search-button-wrapper">
              <button 
                className="action-btn"
                onClick={() => setShowSearchInput(!showSearchInput)}
                disabled={loadingState.isLoading}
                title="웹 검색"
              >
                <Search size={18} />
              </button>
              <div className="tooltip">웹 검색</div>
            </div>
            
            <button 
              className="submit-btn"
              onClick={handleSubmit}
              disabled={loadingState.isLoading || (!input.trim() && !selectedFile) || !apiStatus.isOnline}
            >
              {loadingState.isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {loadingState.step || '처리 중...'}
                </>
              ) : (
                '쉽게 바꾸기 →'
              )}
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.txt,.md,.pdf,.doc,.docx,.hwp"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        {/* URL 입력 모달 */}
        {showUrlInput && (
          <div className="url-input-modal" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}>
            <div style={{
              background: 'white',
              padding: '32px',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            }}>
              <h3 style={{ margin: '0 0 16px 0', textAlign: 'center', color: '#2d3748' }}>
                링크 분석하기
              </h3>
              <p style={{ margin: '0 0 20px 0', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                분석할 웹사이트 링크를 입력하세요
              </p>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '20px',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#26a69a'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && urlInput.trim()) {
                    handleUrlSubmit();
                  }
                }}
                disabled={loadingState.isLoading}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowUrlInput(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#4a5568',
                    cursor: 'pointer',
                  }}
                  disabled={loadingState.isLoading}
                >
                  취소
                </button>
                <button
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim() || loadingState.isLoading}
                  style={{
                    flex: 2,
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    background: urlInput.trim() ? '#26a69a' : '#9ca3af',
                    color: 'white',
                    cursor: urlInput.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  {loadingState.isLoading ? '분석 중...' : '분석하기'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 검색 입력 모달 */}
        {showSearchInput && (
          <div className="search-input-modal" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}>
            <div style={{
              background: 'white',
              padding: '32px',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            }}>
              <h3 style={{ margin: '0 0 16px 0', textAlign: 'center', color: '#2d3748' }}>
                웹 검색하기
              </h3>
              <p style={{ margin: '0 0 20px 0', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                검색할 키워드를 입력하세요. 검색 결과 목록에서 원하는 링크를 선택할 수 있습니다.
              </p>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="예: AI 인공지능 트렌드 2024"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '20px',
                  outline: 'none',
                }}
                onFocus={(e) => e.target.style.borderColor = '#26a69a'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchInput.trim()) {
                    handleSearchSubmit();
                  }
                }}
                disabled={loadingState.isLoading}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => setShowSearchInput(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#4a5568',
                    cursor: 'pointer',
                  }}
                  disabled={loadingState.isLoading}
                >
                  취소
                </button>
                <button
                  onClick={handleSearchSubmit}
                  disabled={!searchInput.trim() || loadingState.isLoading}
                  style={{
                    flex: 2,
                    padding: '12px',
                    border: 'none',
                    borderRadius: '8px',
                    background: searchInput.trim() ? '#26a69a' : '#9ca3af',
                    color: 'white',
                    cursor: searchInput.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  {loadingState.isLoading ? '검색 중...' : '검색하기'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 검색 결과 모달 */}
        {showSearchResults && (
          <div className="search-results-modal" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}>
            <div style={{
              background: 'white',
              padding: '32px',
              borderRadius: '16px',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: '#2d3748' }}>
                  검색 결과 ({searchResults.length}개)
                </h3>
                <button
                  onClick={() => {
                    setShowSearchResults(false);
                    setSearchResults([]);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '20px',
                    color: '#6b7280',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  ✕
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => handleSearchResultSelect(result.link)}
                    style={{
                      padding: '16px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: 'white',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#26a69a';
                      e.currentTarget.style.backgroundColor = '#f0fdf4';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <h4 style={{
                      margin: '0 0 8px 0',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#2d3748',
                      lineHeight: '1.4',
                    }}>
                      {result.title}
                    </h4>
                    
                    <p style={{
                      margin: '0 0 8px 0',
                      fontSize: '14px',
                      color: '#4a5568',
                      lineHeight: '1.5',
                    }}>
                      {result.snippet && result.snippet.length > 150 
                        ? result.snippet.substring(0, 150) + '...' 
                        : result.snippet || '설명이 없습니다.'}
                    </p>
                    
                    <p style={{
                      margin: 0,
                      fontSize: '12px',
                      color: '#26a69a',
                      fontWeight: '500',
                    }}>
                      {result.displayed_link || result.link}
                    </p>
                  </div>
                ))}
              </div>
              
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <button
                  onClick={() => {
                    setShowSearchResults(false);
                    setSearchResults([]);
                    setShowSearchInput(true);
                  }}
                  style={{
                    padding: '12px 24px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    background: 'white',
                    color: '#4a5568',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  다시 검색하기
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="user-stats">
          <span className="stats-icon">💚</span>
          <span className="stats-text">
            지금까지 <strong>{userCount.toLocaleString()}명</strong>이 서비스를 이용했어요!
          </span>
        </div>

        <div className="categories">
          {categories.map((category) => (
            <button 
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="recommended-section">
          {filteredContents.map((content) => (
            <div 
              key={content.id} 
              className="content-card" 
              onClick={() => handleContentCardClick(content)}
              style={{ cursor: loadingState.isLoading ? 'not-allowed' : 'pointer' }}
            >
              <h3>{content.title}</h3>
              <div className="content-meta">
                <span className="views">
                  <Eye size={14} />
                  {content.views}
                </span>
                <div className="content-actions">
                  {content.icon}
                  <span className="content-type">{content.description}</span>
                  <span className="file-type-badge">
                    {content.type === 'document' ? 'PDF' : 
                     content.type === 'link' ? '웹' : 
                     content.type === 'image' ? '이미지' : 
                     content.type}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;