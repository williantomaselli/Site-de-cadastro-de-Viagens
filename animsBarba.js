document.addEventListener('DOMContentLoaded', function() {
    barba.use(barbaCss);
  
    barba.init({
      transitions: [
        {
          name: 'fade',
          once(data) {
            // Quando a página é carregada pela primeira vez
            data.next.container.classList.add('fade-in');
          },
          leave(data) {
            // Animação ao sair da página
            return new Promise((resolve) => {
              data.current.container.classList.add('fade-out');
              setTimeout(resolve, 1000); // Deve corresponder à duração da animação CSS
            });
          },
          enter(data) {
            // Animação ao entrar na nova página
            data.next.container.classList.add('fade-in');
          }
        }
      ]
    });
  });
  