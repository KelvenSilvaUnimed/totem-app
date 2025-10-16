const axios = require('axios');
const qs = require('qs');
const readline = require('readline');

// Configuração do terminal para entrada de dados
const lerDados = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Credenciais e URLs
const dadosAutenticacao = {
  client_id: 'S31C1YiOUpaHatHT8nyzPXK0CDBXlhfM',
  client_secret: 'REMsASUNJXNc6QgBdXomUBly7EYIG5Zi',
  grant_type: 'client_credentials',
  scope: 'read'
};

const UrlAutenticacao = 'https://api.unimedpatos.sgusuite.com.br/oauth2/token';
const UrlDadosBoleto = 'https://api.unimedpatos.sgusuite.com.br/api/procedure/p_prcssa_dados/0177_busca_dados_fatura_aberto';

// Função principal
async function executarConsulta(cnpj, contrato) {
  try {
    // Autenticação
    const respostaAutenticacao = await axios.post(UrlAutenticacao, qs.stringify(dadosAutenticacao), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const token = respostaAutenticacao.data.access_token;
    console.log('\n✅ Token recebido com sucesso.');

    // Consulta de dados
    const respostaDados = await axios.post(UrlDadosBoleto, {
      CNPJ: Number(cnpj),
      CONTRATO: Number(contrato)
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const resultado = respostaDados.data;

    if (resultado.content && resultado.content.length > 0) {
      console.log('\n📄 Faturas encontradas:\n');
      resultado.content.forEach((fatura, index) => {
        console.log(`🔹 Fatura ${index + 1}`);
        console.log(`Número: ${fatura.numerofatura}`);
        console.log(`Vencimento: ${fatura.vencimentofatura}`);
        console.log(`Valor: ${fatura.valorfatura}`);
        console.log(`Linha Digitável: ${fatura.linhadigitavel}\n`);
      });
    } else {
      console.log('\n⚠️ Nenhuma fatura encontrada para os dados informados.');
    }

  } catch (error) {
    console.error('\n❌ Erro na consulta:', error.response?.data || error.message);
  } finally {
    lerDados.close();
  }
}

// Captura de entrada do usuário
lerDados.question('Digite o CNPJ: ', (cnpj) => {
  lerDados.question('Digite o número do contrato: ', (contrato) => {
    executarConsulta(cnpj, contrato);
  });
});