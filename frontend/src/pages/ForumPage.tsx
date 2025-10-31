import { useEffect } from 'react';

const ForumPage = () => {
  useEffect(() => {
    // Redireciona o usuário para o site externo do fórum.
    window.location.href = 'https://forum.zerocharts.com.br';
  }, []);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Redirecionando para o Fórum...</h1>
      <p>Se você não for redirecionado automaticamente, clique no link abaixo:</p>
      <a
        href="https://forum.zerocharts.com.br"
        style={{ color: 'blue', textDecoration: 'underline' }}
      >
        forum.zerocharts.com.br
      </a>
    </div>
  );
};

export default ForumPage;
