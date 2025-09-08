import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Eye, MessageSquare, FileText } from 'lucide-react';
import { DocumentInput } from '../types';
import './HomePage.css';

interface RecommendedContent {
  id: string;
  title: string;
  description: string;
  views: number;
  type: 'document' | 'image' | 'link';
  icon?: React.ReactNode;
}

const HomePage: React.FC = () => {
  const [input, setInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [userCount, setUserCount] = useState(1234);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const recommendedContents: RecommendedContent[] = [
    {
      id: '1',
      title: 'RAG 관련 영상, 웹페이지로 초보자 학습 가이드 만들기',
      description: '유튜브',
      views: 645,
      type: 'link',
      icon: <FileText size={16} />
    },
    {
      id: '2',
      title: 'The Pragmatic Engineer 웹페이지로 엔지니어 성장 To-Do...',
      description: '웹',
      views: 184,
      type: 'link',
      icon: <FileText size={16} />
    },
    {
      id: '3',
      title: '압보험금 관련 영상으로 보험금 청구 핵심 정리하기',
      description: 'shared_source_type.',
      views: 10,
      type: 'document',
      icon: <FileText size={16} />
    }
  ];

  const categories = ['전체', '챗테크', '교육/학생', '연구', '업무리서치', '크리에이터', 'IT/개발/AI', '생활/기타'];

  // 사용자 수를 시뮬레이션 (실제로는 API에서 가져와야 함)
  useEffect(() => {
    // 랜덤하게 증가하는 효과
    const interval = setInterval(() => {
      setUserCount(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const detectInputType = (value: string): 'link' | 'document' => {
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    return urlPattern.test(value) ? 'link' : 'document';
  };

  const handleSubmit = () => {
    if (!input.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    const inputType = detectInputType(input);
    const documentId = Date.now().toString();
    
    const documentInput: DocumentInput = {
      id: documentId,
      type: inputType,
      title: inputType === 'link' ? `링크 분석 - ${new URL(input).hostname}` : '문서 분석',
      content: input,
      url: inputType === 'link' ? input : undefined,
      uploadedAt: new Date(),
    };

    localStorage.setItem(`document_${documentId}`, JSON.stringify(documentInput));
    navigate(`/detail/${documentId}`);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    const documentId = Date.now().toString();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const isImage = file.type.startsWith('image/');
      
      const documentInput: DocumentInput = {
        id: documentId,
        type: isImage ? 'image' : 'document',
        title: file.name,
        content: content,
        uploadedAt: new Date(),
      };
      
      localStorage.setItem(`document_${documentId}`, JSON.stringify(documentInput));
      navigate(`/detail/${documentId}`);
    };
    
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
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
      handleFileUpload(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="home-page">
      <div className="home-container">
        <div className="hero-section">
          <div className="mascot">💚</div>
          <h1>어려운 자료를 쉽게 바꿔드려요!</h1>
        </div>

        <div 
          className={`input-section ${isDragging ? 'dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="https:// 링크를 입력하세요- youtube, blog, news, etc."
            className="main-input"
          />
          
          <div className="input-actions">
            <button 
              className="action-btn"
              onClick={() => fileInputRef.current?.click()}
              title="업로드"
            >
              <Upload size={18} />
            </button>
            
            <button 
              className="submit-btn"
              onClick={handleSubmit}
            >
              쉽게 바꾸기 →
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.txt,.md,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>

        <div className="user-stats">
          <span className="stats-icon">💚</span>
          <span className="stats-text">지금까지 <strong>{userCount.toLocaleString()}명</strong>이 서비스를 이용했어요!</span>
        </div>

        <div className="categories">
          {categories.map((category, index) => (
            <button 
              key={category}
              className={`category-btn ${index === 0 ? 'active' : ''}`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="subtitle">
          커뮤니티에 게시된 모든 페이지는 사용자들이 자발적으로 공유한 것입니다. 플랫폼은 사용자 동의 없이 어떠한 콘텐츠도 표시하지 않습니다.
        </div>

        <div className="recommended-section">
          {recommendedContents.map((content) => (
            <div key={content.id} className="content-card">
              <h3>{content.title}</h3>
              <div className="content-meta">
                <span className="views">
                  <Eye size={14} />
                  {content.views}
                </span>
                <div className="content-actions">
                  {content.icon}
                  <span className="content-type">{content.description}</span>
                  <button className="content-action-btn">
                    <MessageSquare size={14} />
                    웹
                  </button>
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