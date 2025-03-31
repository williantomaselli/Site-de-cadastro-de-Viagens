// evento de submit do formulário de viagem
document.getElementById("form-viagem").addEventListener("submit", function (e) {
    e.preventDefault(); // previne comportamento padrão do formulário
  
    // obtendo os valores dos campos
    const destino = document.getElementById("destino").value;
    const dataViagem = document.getElementById("data-viagem").value;
    const preco = document.getElementById("preco").value;
    const vagas = document.getElementById("vagas").value;
  
    // objeto com os dados
    const viagem = {
        destino: destino,
        data_viagem: dataViagem, // Corrigido
        preco: preco,
        vagas: vagas,
      };
      
  
    // chamada ao backend (rota POST /viagens)
    fetch("http://localhost:3000/add-viagem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(viagem),
      })      
      .then((response) => response.json())
      .then((data) => {
        console.log("viagem cadastrada:", data);
        alert("viagem cadastrada com sucesso!");
        // limpa o formulário
        document.getElementById("form-viagem").reset();
      })
      .catch((error) => {
        console.error("erro:", error);
        alert("erro ao cadastrar viagem");
      });
  });
  