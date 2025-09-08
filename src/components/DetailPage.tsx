import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, HelpCircle, Send } from 'lucide-react';
import { DocumentInput, FAQ, ChatMessage } from '../types';
import './DetailPage.css';

const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<DocumentInput | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const generateFAQs = (doc: DocumentInput) => {
    // 실제로는 AI API를 호출해야 하지만, 여기서는 더미 데이터를 생성
    const dummyFAQs: FAQ[] = [
      {
        id: '1',
        question: `"${doc.title}"의 주요 내용은 무엇인가요?`,
        answer: '문서의 핵심 내용을 요약하면...'
      },
      {
        id: '2',
        question: '이 문서의 목적은 무엇인가요?',
        answer: '문서의 목적과 의도를 분석하면...'
      },
      {
        id: '3',
        question: '주요 키워드는 무엇인가요?',
        answer: '문서에서 추출된 주요 키워드들입니다...'
      }
    ];
    setFaqs(dummyFAQs);
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: currentMessage,
      isUser: true,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    // 실제로는 AI API를 호출해야 하지만, 여기서는 더미 응답을 생성
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `"${currentMessage}"에 대한 답변입니다. 문서를 기반으로 분석해보면...`,
        isUser: false,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
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
          <div className="content-display">
            {document.type === 'image' ? (
              <img src={document.content} alt={document.title} />
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
          <div className="faq-list">
            {faqs.map(faq => (
              <div key={faq.id} className="faq-item">
                <h3>{faq.question}</h3>
                <p>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="chat-section">
          <h2>
            <MessageCircle size={20} />
            질문하기
          </h2>
          <div className="chat-container">
            <div className="chat-messages">
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
                  <div className="message-content">답변을 생성하고 있습니다...</div>
                </div>
              )}
            </div>
            <div className="chat-input">
              <textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
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