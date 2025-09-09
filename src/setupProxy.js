const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Kintel API 프록시 (문서/이미지 처리, 질문 생성)
  app.use(
    '/api/kintel',
    createProxyMiddleware({
      target: 'http://localhost:51037',
      changeOrigin: true,
      pathRewrite: {
        '^/api/kintel': '', // /api/kintel을 제거
      },
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('Kintel 프록시 오류:', err.message);
      },
    })
  );

  // Models API 프록시 - Intent 분류, Chat (51036)
  app.use(
    '/api/models/intent',
    createProxyMiddleware({
      target: 'http://20.190.194.245:51036',
      changeOrigin: true,
      pathRewrite: {
        '^/api/models': '', // /api/models를 제거
      },
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('Models Intent 프록시 오류:', err.message);
      },
    })
  );

  app.use(
    '/api/models/chat',
    createProxyMiddleware({
      target: 'http://20.190.194.245:51036',
      changeOrigin: true,
      pathRewrite: {
        '^/api/models': '', // /api/models를 제거
      },
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('Models Chat 프록시 오류:', err.message);
      },
    })
  );

  // FAQ Answer Model 프록시 (51038)
  app.use(
    '/api/models/faq_answer_model',
    createProxyMiddleware({
      target: 'http://localhost:51038',
      changeOrigin: true,
      pathRewrite: {
        '^/api/models': '', // /api/models를 제거
      },
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('Models FAQ 프록시 오류:', err.message);
      },
    })
  );

  // Summarization 프록시 (51036)
  app.use(
    '/api/models/summarization',
    createProxyMiddleware({
      target: 'http://20.190.194.245:51036',
      changeOrigin: true,
      pathRewrite: {
        '^/api/models': '', // /api/models를 제거
      },
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('Models Summary 프록시 오류:', err.message);
      },
    })
  );
};
