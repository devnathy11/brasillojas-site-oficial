import React, { useEffect } from 'react';

const Comprovante = () => {
  useEffect(() => {
    // Esse é o "empurrãozinho" para imprimir assim que a página abrir
    const timer = setTimeout(() => {
      window.print();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '400px', margin: '0 auto' }}>
      <div id="area-impressao">
        <h2 style={{ color: '#2e7d32', textAlign: 'center' }}>Brasillojas</h2>
        <p style={{ textAlign: 'center' }}>Comprovante de Pedido</p>
        <hr />
        <p><strong>Cliente:</strong> Usuário Brasillojas</p>
        <p><strong>Produto:</strong> Item do Carrinho</p>
        <p><strong>Total:</strong> R$ 250,00</p>
        <hr />
        <p style={{ fontSize: '12px', textAlign: 'center' }}>Obrigado por comprar conosco!</p>
      </div>

      {/* Estilo especial para esconder coisas inúteis na impressão */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #area-impressao, #area-impressao * { visibility: visible; }
          #area-impressao { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Comprovante;