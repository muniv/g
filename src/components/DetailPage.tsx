import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, HelpCircle, Send, Loader } from 'lucide-react';
import { DocumentInput, FAQ, ChatMessage } from '../types/index';
import './DetailPage.css';

import * as api from '../services/api';

export type ChatHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<DocumentInput | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('스마트 AI가 답변을 생성하고 있습니다...');
  const [smartResponse, setSmartResponse] = useState<{
    usedFaqModel: boolean;
    processingTime: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'faq' | 'easy' | 'graphic'>('faq');

  useEffect(() => {
    if (id) {
      const savedDocument = localStorage.getItem(`document_${id}`);
      if (savedDocument) {
        const parsedDocument = JSON.parse(savedDocument);
        parsedDocument.uploadedAt = new Date(parsedDocument.uploadedAt);
        setDocument(parsedDocument);
        generateFAQs(parsedDocument);
      }
    }
  }, [id]);

  const generateFAQs = async (doc: DocumentInput) => {
    console.log('DetailPage generateFAQs - 전체 doc:', doc);
    console.log('DetailPage generatedQuestions 존재 여부:', !!doc.generatedQuestions);
    console.log('DetailPage generatedQuestions 길이:', doc.generatedQuestions?.length);
    console.log('DetailPage generatedQuestions:', doc.generatedQuestions);
    console.log('DetailPage chunkMapping:', doc.chunkMapping);
    console.log('DetailPage parsedData chunks:', doc.parsedData?.chunks);
    
    // generatedQuestions 각 항목을 개별 로깅
    if (doc.generatedQuestions && Array.isArray(doc.generatedQuestions)) {
      doc.generatedQuestions.forEach((item, i) => {
        console.log(`DetailPage generatedQuestions[${i}]:`, item);
      });
    }
    
    if (doc.generatedQuestions && doc.generatedQuestions.length > 0) {
      // 이미 생성된 질문이 있으면 사용
      console.log('DetailPage - 생성된 질문 사용:', doc.generatedQuestions);
      
      // 청크 ID → 텍스트 매핑 생성
      const chunkMap = new Map<string, string>();
      if (doc.parsedData?.chunks) {
        doc.parsedData.chunks.forEach(chunk => {
          chunkMap.set(chunk.chunk_id, chunk.source);
          console.log(`청크 매핑 저장: ${chunk.chunk_id} -> ${chunk.source.substring(0, 50)}...`);
        });
      }
      
      // HomePage에서 평탄화되어 전달된 질문 구조 처리
      const allQuestions: Array<{question: string, chunkId: string, chunkText: string}> = [];
      
      console.log('전달받은 generatedQuestions:', doc.generatedQuestions);
      console.log('전달받은 chunkMapping:', doc.chunkMapping);
      
      for (let i = 0; i < doc.generatedQuestions.length; i++) {
        const questionItem = doc.generatedQuestions[i];
        console.log(`질문 아이템 [${i}]:`, questionItem);
        
        let chunkText = doc.content || '';
        let chunkId = '';
        
        // 평탄화된 구조에서 chunk_id 직접 사용
        if ((questionItem as any).chunk_id) {
          chunkId = (questionItem as any).chunk_id;
          // chunkMapping에서 해당 chunk_id의 텍스트 찾기
          if (doc.chunkMapping && Array.isArray(doc.chunkMapping)) {
            const mapping = doc.chunkMapping.find((m: any) => m.chunk_id === chunkId);
            if (mapping) {
              chunkText = mapping.source;
              console.log(`chunkMapping에서 찾은 텍스트 (chunk ${chunkId}): ${chunkText.substring(0, 50)}...`);
            }
          }
          
          // chunkMapping에서 찾지 못한 경우 parsedData의 chunks에서 찾기
          if (!chunkText || chunkText === doc.content) {
            const chunk = doc.parsedData?.chunks?.find(c => c.chunk_id === chunkId);
            if (chunk) {
              chunkText = chunk.source;
              console.log(`parsedData에서 찾은 텍스트 (chunk ${chunkId}): ${chunkText.substring(0, 50)}...`);
            }
          }
        }
        
        // 평탄화된 구조에서 question 추출
        let questionText = '';
        if ((questionItem as any).question && typeof (questionItem as any).question === 'string') {
          questionText = (questionItem as any).question;
          console.log(`평탄화된 질문: ${questionText}`);
        }
        
        if (questionText && questionText.trim()) {
          allQuestions.push({
            question: questionText.trim(),
            chunkId: chunkId,
            chunkText: chunkText
          });
          console.log(`최종 질문 추가: ${questionText.trim()}`);
        }
      }
      
      // 질문이 있으면 로딩 상태로 표시, 없으면 기본 FAQ 표시
      if (allQuestions.length > 0) {
        console.log(`${allQuestions.length}개의 질문을 찾아 FAQ 생성 중`);
        console.log('allQuestions 내용:', allQuestions.map((q, i) => `[${i}] ${q.question}`));
        
        // FAQ 배열 생성 및 설정
        const initialFAQs: FAQ[] = allQuestions.map((item, index) => ({
          id: `faq-${index}`,
          question: item.question,
          answer: '답변을 생성하고 있습니다...'
        }));
        
        setFaqs(initialFAQs);
        console.log('생성된 FAQ 배열:', initialFAQs.map((faq, i) => `[${i}] ${faq.question}`));
      } else {
        // 첫 페이지에서 생성된 질문이 없으면 빈 상태
        console.log('첫 페이지에서 생성된 질문이 없음 - FAQ 없음');
        setFaqs([]);
        return;
      }
      
      // 전체 문서 컨텍스트 준비 (더 정확한 답변을 위해)
      const fullDocumentContext = [
        doc.content,
        ...(doc.parsedData?.chunks.map(chunk => chunk.source) || [])
      ].join('\n\n');
      
      // 비동기적으로 각 답변 생성 및 업데이트 (병렬 처리하되 인덱스로 정확히 매칭)
      allQuestions.forEach(async (item, questionIndex) => {
        const faqId = `faq-${questionIndex}`;
        
        try {
          console.log(`FAQ 답변 생성 중 ${faqId} (인덱스 ${questionIndex}): ${item.question}`);
          console.log(`해당 청크 ID: ${item.chunkId}`);
          
          // FAQ 답변 생성을 위한 컨텍스트 준비
          let contextForAnswer = '';
          
          // 1순위: 문서 요약 사용 (있는 경우) - 최대 800자로 제한
          if (doc.summary && doc.summary.trim().length > 0) {
            contextForAnswer = doc.summary.length > 800 
              ? doc.summary.substring(0, 800) 
              : doc.summary;
            console.log(`FAQ 답변에 요약 사용 (${contextForAnswer.length}자):`, contextForAnswer.substring(0, 100) + '...');
          } 
          // 2순위: 해당 청크 텍스트 - 최대 600자로 제한
          else {
            contextForAnswer = item.chunkText;
            
            // 청크가 너무 짧으면 추가 컨텍스트, 하지만 최대 600자로 제한
            if (item.chunkText.length < 200 && fullDocumentContext) {
              const additionalContext = fullDocumentContext.substring(0, 400);
              contextForAnswer = item.chunkText + '\n\n' + additionalContext;
              if (contextForAnswer.length > 600) {
                contextForAnswer = contextForAnswer.substring(0, 600);
              }
            } else if (item.chunkText.length > 600) {
              // 너무 긴 청크는 잘라서 사용
              contextForAnswer = item.chunkText.substring(0, 600);
            }
            console.log(`FAQ 답변에 청크 텍스트 사용 (${contextForAnswer.length}자)`);
          }
          
          console.log(`컨텍스트 크기: ${contextForAnswer.length}자`);
          
          // 재시도 로직이 있는 FAQ 답변 생성
          console.log(`FAQ API 호출 시작: ${item.question}`);
          console.log(`사용할 컨텍스트: ${contextForAnswer.substring(0, 100)}...`);
          let faqResult = await api.generateFaqAnswer(item.question, contextForAnswer);
          console.log(`FAQ API 응답:`, faqResult);
          
          // 첫 시도 실패시 더 짧은 컨텍스트로 재시도 (모델 길이 제한 에러 포함)
          if (!faqResult.success && (
            faqResult.error?.includes('500') || 
            faqResult.error?.includes('504') || 
            faqResult.error?.includes('timeout') ||
            faqResult.error?.includes('Max retries exceeded') ||
            faqResult.error?.includes('maximum model length') ||
            faqResult.error?.includes('decoder prompt')
          )) {
            console.log(`${faqId} 재시도: 더 짧은 컨텍스트 사용 (300자 제한)`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
            contextForAnswer = item.chunkText.substring(0, 300); // 더 짧게 제한
            console.log(`재시도 컨텍스트 크기: ${contextForAnswer.length}자`);
            faqResult = await api.generateFaqAnswer(item.question, contextForAnswer);
          }
          
          let answer = '';
          if (faqResult.success && faqResult.data) {
            answer = faqResult.data;
            console.log(`FAQ 답변 성공 ${faqId} (인덱스 ${questionIndex}): ${item.question} -> ${answer.substring(0, 50)}...`);
          } else {
            console.warn(`FAQ 답변 API 최종 실패 ${faqId}:`, faqResult.error);
            answer = generateFallbackAnswer(item.question, fullDocumentContext);
          }
          
          // 이중 확인: 인덱스와 질문 텍스트 모두로 매칭
          setFaqs(prev => {
            console.log(`FAQ 업데이트 시도: 인덱스 ${questionIndex}, 질문: ${item.question}`);
            
            const updated = prev.map((faq, faqIndex) => {
              // 인덱스와 질문 텍스트 둘 다 확인
              const indexMatch = faqIndex === questionIndex;
              const textMatch = faq.question === item.question;
              
              if (indexMatch && textMatch) {
                console.log(`✅ 완벽 매칭! 인덱스 ${faqIndex}: ${faq.question}`);
                return { ...faq, answer };
              } else if (indexMatch && !textMatch) {
                console.warn(`⚠️ 인덱스는 맞지만 질문이 다름! ${faqIndex}: "${faq.question}" vs "${item.question}"`);
                return { ...faq, answer }; // 일단 업데이트 하되 경고
              } else if (!indexMatch && textMatch) {
                console.warn(`⚠️ 질문은 맞지만 인덱스가 다름! 예상 ${questionIndex}, 실제 ${faqIndex}`);
                return { ...faq, answer }; // 질문이 맞으면 업데이트
              }
              return faq;
            });
            
            return updated;
          });
          
        } catch (error) {
          console.error(`FAQ 답변 오류 ${faqId}:`, error);
          // 오류시 기본 답변으로 업데이트 (정확한 인덱스 매칭)
          setFaqs(prev => {
            const fallbackAnswer = generateFallbackAnswer(item.question, fullDocumentContext);
            console.log(`FAQ 오류 복구: 인덱스 ${questionIndex}, 질문: ${item.question}, 기본답변: ${fallbackAnswer.substring(0, 50)}...`);
            
            return prev.map((faq, faqIndex) => 
              faqIndex === questionIndex
                ? { ...faq, answer: fallbackAnswer } 
                : faq
            );
          });
        }
      });
    } else {
      // generatedQuestions가 없는 경우 빈 상태
      console.log('DetailPage - generatedQuestions가 없음 - FAQ 없음');
      setFaqs([]);
    }
  };

  const generateFallbackAnswer = (question: string, documentContext?: string): string => {
    const query = question.toLowerCase();
    
    // 문서 컨텍스트가 있다면 실제 문서 내용을 기반으로 답변 생성
    if (documentContext) {
      const docLower = documentContext.toLowerCase();
      
      // 소득별 맞춤형 지원 관련
      if (query.includes('소득별') && query.includes('맞춤형')) {
        // 문서에서 소득별 지원 정보 추출
        if (docLower.includes('소득별') || docLower.includes('상위 10%') || docLower.includes('기초수급자')) {
          const lines = documentContext.split('\n').filter(line => 
            line.includes('상위 10%') || line.includes('일반국민') || 
            line.includes('기초수급자') || line.includes('차상위') ||
            line.includes('만원')
          );
          if (lines.length > 0) {
            return `문서에 따르면, ${lines.slice(0, 3).join(' ')}`;
          }
        }
        return '소득별 맞춤형 지원에 대한 자세한 내용은 문서를 참조해주세요.';
      }
    } else {
      // 기존 하드코딩된 답변 유지
      if (query.includes('소득별') && query.includes('맞춤형')) {
        return '소득별 맞춤형 지원은 가구 소득 수준에 따라 차등 지급되며, 상위 10%는 15만원, 일반국민은 35만원, 농어촌 지역은 55만원까지 지원됩니다.';
      }
    }
    
    // 1차, 2차 지원 차이 관련
    if ((query.includes('1차') || query.includes('2차')) && (query.includes('차이') || query.includes('기준'))) {
      return '1차는 2025년 7월-9월 신청으로 선지급 방식이며, 2차는 2025년 9월-10월 신청으로 본지급 방식입니다. 대상 기준은 동일하지만 지급 시기와 방식이 다릅니다.';
    }
    
    // 지역사랑상품권과 카드 사용처 관련
    if (query.includes('지역사랑상품권') && (query.includes('카드') || query.includes('사용처'))) {
      return '지역사랑상품권은 해당 지역 내 가맹점에서만 사용 가능하며, 신용·체크·선불카드는 전국 가맹점에서 사용 가능합니다. 사용처 제한이 다릅니다.';
    }
    
    // 비수도권/농어촌 지역 관련
    if ((query.includes('비수도권') || query.includes('농어촌')) && (query.includes('상위') || query.includes('일반국민'))) {
      return '비수도권/농어촌 인구 감소지역에서는 상위 10%가 25만원, 일반국민이 55만원으로 일반국민이 30만원 더 많이 받습니다.';
    }
    
    // 본관/별관 위치 관련
    if (query.includes('본관') && query.includes('별관') && query.includes('주소')) {
      return '본관과 별관이 같은 건물에 위치해도 행정구역상 구분이나 우편번호 체계에 따라 주소가 다를 수 있습니다.';
    }
    
    // 콜센터 근무시간 외 문의 관련
    if (query.includes('콜센터') && (query.includes('근무시간') || query.includes('시간')) && query.includes('문의')) {
      return '행정안전부 콜센터 근무시간 외에는 온라인 홈페이지나 모바일 앱을 통해 FAQ를 확인하거나, 읍면동 주민센터를 통해 문의할 수 있습니다.';
    }
    
    // 일반적인 소비쿠폰/민생회복 관련
    if (query.includes('소비쿠폰') || query.includes('민생회복')) {
      if (query.includes('대상') || query.includes('누구')) {
        return '민생회복 소비쿠폰은 전 국민을 대상으로 지급됩니다.';
      } else if (query.includes('금액') || query.includes('얼마')) {
        return '1인당 15~55만원이 지급되며, 소득별 맞춤형 지원으로 단계적 지급됩니다.';
      } else if (query.includes('신청') || query.includes('방법')) {
        return '온라인(카드사·지역사랑상품권 홈페이지, 앱, 콜센터, ARS) 또는 오프라인(제휴은행 영업점, 읍면동 주민센터)에서 신청할 수 있습니다.';
      } else if (query.includes('기간') || query.includes('언제')) {
        return '1차: 2025.07.21.(월) ~ 09.12.(금), 2차: 2025.09.22.(월) ~ 10.31.(금)에 신청 가능하며, 사용기한은 2025.11.30.(일)까지입니다.';
      } else {
        return '민생회복 소비쿠폰에 대한 자세한 내용을 확인하시려면 더 구체적인 질문을 해주시기 바랍니다.';
      }
    }
    
    // 일반적인 문서 관련 질문
    if (query.includes('주요') && (query.includes('내용') || query.includes('요약'))) {
      return '문서의 핵심 내용과 주요 포인트를 요약하여 제공해드릴 수 있습니다.';
    } else if (query.includes('목적') || query.includes('의도')) {
      return '문서의 작성 목적과 의도를 분석하여 설명해드릴 수 있습니다.';
    } else if (query.includes('키워드') || query.includes('용어')) {
      return '문서에서 추출된 주요 키워드와 핵심 용어들을 정리해드릴 수 있습니다.';
    }
    
    // 문서 컨텍스트를 활용한 일반적인 답변
    if (documentContext) {
      // 문서에서 키워드 관련 정보 찾기
      const questionWords = question.split(/\s+/).filter(word => word.length > 1);
      let relevantLines: string[] = [];
      
      for (const word of questionWords) {
        const lines = documentContext.split('\n').filter(line => 
          line.toLowerCase().includes(word.toLowerCase()) && line.trim().length > 20
        );
        relevantLines = [...relevantLines, ...lines.slice(0, 2)];
      }
      
      if (relevantLines.length > 0) {
        const uniqueLines = Array.from(new Set(relevantLines));
        return `"${question}"에 대해 문서에서 찾은 관련 정보는 다음과 같습니다: ${uniqueLines.slice(0, 2).join(' ')}`;
      }
      
      return `"${question}"에 대한 정보를 문서에서 찾아보았으나, 더 구체적인 답변을 위해 전체 문서를 참조해주세요.`;
    }
    
    // 기본 답변
    return `"${question}"에 대한 답변을 위해 문서를 분석했습니다. 더 구체적인 질문을 해주시면 더 정확한 답변을 제공해드리겠습니다.`;
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !document) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: currentMessage,
      isUser: true,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const queryText = currentMessage;
    setCurrentMessage('');
    setIsLoading(true);
    setSmartResponse(null);

    // 동적 로딩 메시지
    const loadingMessages = [
      '문서를 분석하고 있습니다...',
      '관련 정보를 찾고 있습니다...',
      'AI가 답변을 생성하고 있습니다...',
      '최적의 답변을 준비하고 있습니다...'
    ];
    let messageIndex = 0;
    setLoadingMessage(loadingMessages[0]);
    
    const loadingInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 2000);

    try {
      // 채팅 히스토리 준비
      const chatHistory: ChatHistoryItem[] = chatMessages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.content
      }));

      // 문서 컨텍스트 준비 (문서 내용 + 청크 내용)
      const documentContext = [
        document.content,
        ...(document.parsedData?.chunks.map(chunk => chunk.source) || [])
      ].join('\n\n');

      console.log('스마트 채팅 시작:', queryText);
      const startTime = Date.now();

      // 실제 API 호출 (FAQ-A 모델에는 요약 전달)
      const result = await api.getSmartChatResponse(
        queryText,
        documentContext,
        document.summary // 문서 요약을 summary 파라미터로 전달
      );

      const processingTime = Date.now() - startTime;

      let responseContent = '';
      let usedFaqModel = false;

      if (result.success && result.data) {
        // API 응답 성공
        if (typeof result.data === 'string') {
          responseContent = result.data;
        } else if (result.data.response) {
          responseContent = result.data.response;
          usedFaqModel = result.data.usedFaqModel || false;
        }
      } else {
        // API 실패시 기본 응답
        console.warn('스마트 채팅 API 실패, 기본 응답 사용:', result.error);
        const query = queryText.toLowerCase();
        
        if (query.includes('소비쿠폰') || query.includes('민생회복')) {
          if (query.includes('대상') || query.includes('누구')) {
            responseContent = '민생회복 소비쿠폰은 전 국민을 대상으로 지급됩니다.';
          } else if (query.includes('금액') || query.includes('얼마')) {
            responseContent = '1인당 15~55만원이 지급되며, 소득별 맞춤형 지원으로 단계적 지급됩니다.';
          } else if (query.includes('신청') || query.includes('방법')) {
            responseContent = '온라인(카드사·지역사랑상품권 홈페이지, 앱, 콜센터, ARS) 또는 오프라인(제휴은행 영업점, 읍면동 주민센터)에서 신청할 수 있습니다.';
          } else if (query.includes('기간') || query.includes('언제')) {
            responseContent = '1차: 2025.07.21.(월) ~ 09.12.(금), 2차: 2025.09.22.(월) ~ 10.31.(금)에 신청 가능하며, 사용기한은 2025.11.30.(일)까지입니다.';
          } else {
            responseContent = '민생회복 소비쿠폰에 대한 질문이군요. 더 구체적인 질문을 해주시면 더 정확한 답변을 드릴 수 있습니다.';
          }
        } else {
          responseContent = `"${queryText}"에 대한 답변입니다. 문서를 기반으로 분석해보면, 관련 정보를 찾아드릴 수 있습니다. 더 구체적인 질문을 해주시면 더 정확한 답변을 제공해드리겠습니다.`;
        }
      }

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: responseContent,
        isUser: false,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, aiResponse]);
      
      // 스마트 응답 정보 설정
      setSmartResponse({
        usedFaqModel,
        processingTime
      });

      console.log('스마트 채팅 응답 완료:', processingTime + 'ms');

    } catch (error) {
      console.error('채팅 오류:', error);
      
      let errorMessage = '죄송합니다. 예상치 못한 오류가 발생했습니다.';
      
      if (error instanceof TypeError) {
        // 네트워크 연결 오류
        errorMessage = '네트워크 연결에 문제가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.';
      } else if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
          // 타임아웃 오류
          errorMessage = '서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('fetch')) {
          // API 호출 오류
          errorMessage = 'API 서버에 연결할 수 없습니다. 서버 상태를 확인해주세요.';
        } else if (error.message.includes('JSON')) {
          // JSON 파싱 오류
          errorMessage = '서버 응답을 처리하는 중 오류가 발생했습니다.';
        }
      }
      
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: errorMessage + ' 문제가 지속되면 관리자에게 문의해주세요.',
        isUser: false,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorResponse]);
    } finally {
      clearInterval(loadingInterval);
      setIsLoading(false);
      setLoadingMessage('스마트 AI가 답변을 생성하고 있습니다...');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!document) {
    return (
      <div className="detail-page">
        <div className="container">
          <p>문서를 찾을 수 없습니다.</p>
          <button onClick={() => navigate('/')} className="back-btn">
            <ArrowLeft size={16} />
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <header className="detail-header">
        <button onClick={() => navigate('/')} className="back-btn">
          <ArrowLeft size={16} />
          돌아가기
        </button>
        <div className="document-info">
          <h1>{document.title}</h1>
          <p>
            {document.type === 'document' && '문서'}
            {document.type === 'image' && '이미지'}
            {document.type === 'link' && '링크'}
            • {document.uploadedAt.toLocaleDateString()}
          </p>
        </div>
      </header>

      <div className="content-grid">
        <div className="document-content">
          <h2>문서 내용</h2>
          {document.url && (
            <div className="url-info">
              <strong>원본 URL:</strong> 
              <a href={document.url} target="_blank" rel="noopener noreferrer" className="url-link">
                {document.url}
              </a>
            </div>
          )}
          <div className="content-display">
            {document.type === 'image' ? (
              <>
                {/* 이미지에서 추출된 텍스트 표시 - 연속된 텍스트로 */}
                {document.parsedData ? (
                  <div className="parsed-content">
                    <h3>추출된 텍스트</h3>
                    <div className="continuous-content">
                      {document.parsedData.chunks.map(chunk => chunk.source).join('\n\n')}
                    </div>
                  </div>
                ) : (
                  document.content && <pre>{document.content}</pre>
                )}
              </>
            ) : document.parsedData ? (
              <div className="parsed-content">
                <div className="continuous-content">
                  {document.parsedData.chunks.map(chunk => chunk.source).join('\n\n')}
                </div>
              </div>
            ) : (
              <pre>{document.content}</pre>
            )}
          </div>
        </div>

        <div className="faqs">
          <h2>
            <HelpCircle size={20} />
            자주 묻는 질문
          </h2>
          
          {/* 탭 메뉴 */}
          <div className="faq-tabs">
            <button 
              className={`tab-btn ${activeTab === 'faq' ? 'active' : ''}`}
              onClick={() => setActiveTab('faq')}
            >
              FAQ
            </button>
            <button 
              className={`tab-btn ${activeTab === 'easy' ? 'active' : ''}`}
              onClick={() => setActiveTab('easy')}
              title="쉬운말 변환 기능을 준비중입니다"
            >
              쉬운말 변환
            </button>
            <button 
              className={`tab-btn ${activeTab === 'graphic' ? 'active' : ''}`}
              onClick={() => setActiveTab('graphic')}
              title="그래픽 요약 기능을 준비중입니다"
            >
              그래픽 요약
            </button>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="tab-content">
            {activeTab === 'faq' ? (
              <div className="faq-list">
                {faqs.map(faq => (
                  <div key={faq.id} className="faq-item">
                    <h3>{faq.question}</h3>
                    {faq.answer === '답변을 생성하고 있습니다...' ? (
                      <p className="loading">
                        <Loader size={14} className="inline-loader" />
                        {faq.answer}
                      </p>
                    ) : (
                      <div className="faq-answer">
                        {(() => {
                          // 답변과 근거를 구분하여 파싱
                      const answerText = faq.answer;
                      let mainAnswer = answerText;
                      let sourceText = '';
                      
                      // 근거, 참고, 출처 등으로 구분
                      const splitPatterns = [
                        '답변 근거는 아래와 같습니다',
                        '근거는 아래와 같습니다',
                        '답변 근거는 다음과 같습니다',
                        '근거는 다음과 같습니다',
                        '근거:',
                        '참고:',
                        '출처:',
                        '[근거]',
                        '[참고]',
                        '[출처]'
                      ];
                      
                      for (const pattern of splitPatterns) {
                        if (answerText.includes(pattern)) {
                          const parts = answerText.split(pattern);
                          if (parts.length >= 2) {
                            mainAnswer = parts[0].trim();
                            sourceText = parts.slice(1).join(pattern).trim();
                            // 근거 텍스트 시작에서 마침표와 공백 제거
                            sourceText = sourceText.replace(/^[.\s]+/, '');
                            break;
                          }
                        }
                      }
                      
                      return (
                        <>
                          <div className="faq-main-answer">
                            {mainAnswer}
                          </div>
                          {sourceText && (
                            <div className="faq-source">
                              <strong>근거:</strong> {sourceText}
                            </div>
                          )}
                        </>
                      );
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : activeTab === 'easy' ? (
              <div className="coming-soon">
                <div className="coming-soon-message">
                  <h3>🔄 쉬운말 변환</h3>
                  <p>어려운 공고 내용을 이해하기 쉬운 말로 변환해드리는 기능을 준비중입니다.</p>
                  <span className="coming-soon-badge">준비중</span>
                </div>
              </div>
            ) : (
              <div className="coming-soon">
                <div className="coming-soon-message">
                  <h3>📊 그래픽 요약</h3>
                  <p>복잡한 문서 내용을 시각적인 차트와 그래픽으로 요약해드리는 기능을 준비중입니다.</p>
                  <span className="coming-soon-badge">준비중</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="chat-section">
          <h2>
            <MessageCircle size={20} />
            스마트 AI 질문하기
          </h2>
          
          {/* 스마트 응답 정보 표시 */}
          
          <div className="chat-container">
            <div className="chat-messages">
              {chatMessages.length === 0 && !isLoading && faqs.length > 0 && (
                <div className="suggested-questions">
                  <div className="suggestion-header">💡 추천 질문</div>
                  {(() => {
                    // FAQ에서 랜덤하게 3개 선택
                    const availableFaqs = faqs.filter(faq => faq.answer !== '답변을 생성하고 있습니다...');
                    const shuffled = [...availableFaqs].sort(() => 0.5 - Math.random());
                    const selectedFaqs = shuffled.slice(0, 3);
                    
                    return selectedFaqs.map((faq, index) => (
                      <div 
                        key={`suggestion-${index}`} 
                        className="suggestion-item"
                        onClick={() => {
                          setCurrentMessage(faq.question);
                          // 자동으로 전송하지 않고 입력창에만 채워넣음
                        }}
                      >
                        {faq.question}
                      </div>
                    ));
                  })()}
                </div>
              )}
              
              {chatMessages.map(message => (
                <div key={message.id} className={`message ${message.isUser ? 'user' : 'ai'}`}>
                  <div className="message-content">{message.content}</div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message ai">
                  <div className="message-content loading">
                    <Loader size={16} className="animate-spin" />
                    {loadingMessage}
                  </div>
                </div>
              )}
            </div>
            <div className="chat-input">
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="문서에 대해 질문해보세요..."
                rows={2}
              />
              <button 
                onClick={handleSendMessage}
                disabled={!currentMessage.trim() || isLoading}
                className="send-btn"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailPage;