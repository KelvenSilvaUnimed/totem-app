
"use strict";

// ====== CONFIG ======
const API_BASE =
  window.location.protocol.startsWith("http") && window.location.host
    ? `${window.location.protocol}//${window.location.host}`
    : "http://localhost:3000";

// ====== STATE ======
const state = {
  beneficiario: null,
  servicoSelecionado: null,
  contratoInformado: null,
  cnpjInformado: null,
  faturas: [],
  boletoAtual: { numero: null, url: null }
};

// ====== REFS ======
const refs = {
  steps: {
    cpf: document.getElementById("step-cpf"),
    servicos: document.getElementById("step-servicos"),
    contrato: document.getElementById("step-contrato"),
    faturas: document.getElementById("step-faturas")
  },
  cpfInput: document.getElementById("cpf"),
  btnValidarCpf: document.getElementById("btn-validar-cpf"),
  nome: document.getElementById("beneficiario-nome"),
  plano: document.getElementById("beneficiario-plano"),
  btnTrocarCpf: document.getElementById("btn-trocar-cpf"),
  contratoInput: document.getElementById("contrato"),
  btnContrato: document.getElementById("btn-carregar-faturas"),
  btnVoltarServicos: document.getElementById("btn-voltar-servicos"),
  faturasResumo: document.getElementById("resumo-faturas"),
  faturasLista: document.getElementById("lista-faturas"),
  instrucaoFaturas: document.getElementById("texto-instrucao"),
  pdfPreview: document.getElementById("pdf-preview"),
  pdfLegenda: document.getElementById("pdf-legenda"),
  pdfContainer: document.getElementById("pdf-container"),
  pdfActions: document.getElementById("pdf-actions"),
  btnVisualizarBoleto: document.getElementById("btn-visualizar-boleto"),
  btnEnviarEmail: document.getElementById("btn-enviar-email"),
  btnEnviarWhatsapp: document.getElementById("btn-enviar-whatsapp"),
  btnImprimirPdf: document.getElementById("btn-imprimir-pdf"),
  cnpjInput: document.getElementById("cnpj"),
  contratoGroup: document.getElementById("contrato-group"),
  btnNovoDocumento: document.getElementById("btn-novo-documento"),
  status: document.getElementById("status"),
  loading: document.getElementById("loading"),
  pdfModal: document.getElementById("pdf-modal"),
  modalTitle: document.getElementById("modal-title"),
  modalClose: document.getElementById("modal-close"),
  modalFrame: document.getElementById("modal-frame")
};

// ====== UTILS ======
function digits(value) { return (value || "").replace(/\D/g, ""); }
function setStep(stepId) { Object.values(refs.steps).forEach((s) => { s.classList.toggle("active", s.id === stepId); }); }
function resetStatus() { refs.status.style.display = "none"; refs.status.textContent = ""; refs.status.className = "status"; }
function showStatus(message, type = "ok") { refs.status.textContent = message; refs.status.className = "status " + (type || "ok"); refs.status.style.display = "block"; }
function setLoading(isLoading) {
  if (refs.loading) refs.loading.style.display = isLoading ? "block" : "none";
  document.querySelectorAll("button").forEach((button) => {
    const locked = button.getAttribute("data-lock") === "true" || button.dataset.lock === "true";
    button.disabled = isLoading ? true : locked;
  });
}

// ====== MODAL ======
function openModal(pdfUrl, numeroFatura) {
  refs.modalTitle.textContent = `Visualizando Boleto - Fatura ${numeroFatura}`;
  refs.modalFrame.src = pdfUrl; refs.pdfModal.style.display = "block"; document.body.style.overflow = "hidden";
}
function closeModal() { refs.pdfModal.style.display = "none"; refs.modalFrame.src = ""; document.body.style.overflow = "auto"; }

// ====== API ======
async function lookupByCpf(cpf) {
  const r = await fetch(API_BASE + "/api/identificacao/lookup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documento: cpf }) });
  const data = await r.json().catch(() => ({})); if (!r.ok) throw new Error(data.error || ("Erro " + r.status)); return data;
}
async function buscarFaturas(cpfCnpj, contrato) {
  const r = await fetch(API_BASE + "/api/faturas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cpfCnpj, contrato }) });
  const data = await r.json().catch(() => ({})); if (!r.ok) throw new Error(data.error || ("Erro " + r.status)); return Array.isArray(data.content) ? data.content : [];
}

// --- Blob helpers
function revokeIfBlob() { try { if (state.boletoAtual && state.boletoAtual.kind === "blob" && state.boletoAtual.url) { URL.revokeObjectURL(state.boletoAtual.url); } } catch {} }
function renderPreviewIfPossible() {
  // Preferir exibir via /api/pdf quando houver URL remota original
  const remote = state.boletoAtual?.remoteUrl;
  if (remote) {
    const src = API_BASE + '/api/pdf?url=' + encodeURIComponent(remote) + '&t=' + Date.now();
    refs.pdfContainer.innerHTML = '';
    const frame = document.createElement('iframe');
    frame.className = 'modal-frame';
    frame.src = src;
    frame.style.width = '100%';
    frame.style.height = '480px';
    frame.style.border = '0';
    refs.pdfContainer.appendChild(frame);
    return;
  }
  if (state.boletoAtual?.kind === 'blob' && state.boletoAtual.url) {
    refs.pdfContainer.innerHTML = '';
    const frame = document.createElement('iframe');
    frame.className = 'modal-frame';
    frame.src = state.boletoAtual.url + '#toolbar=0&navpanes=0&view=FitH';
    frame.style.width = '100%';
    frame.style.height = '480px';
    frame.style.border = '0';
    refs.pdfContainer.appendChild(frame);
  } else {
    refs.pdfContainer.innerHTML = '<div class="pdf-info"><div class="icon">📄</div><div><strong>Boleto carregado</strong></div><div style="font-size:14px;margin-top:8px;">Este emissor não permite incorporação. Use <strong>Visualizar</strong> ou <strong>Imprimir</strong>.</div></div>';
  }
}
async function buscarBoleto(numeroFatura) {
  const r = await fetch(API_BASE + "/api/boleto", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/pdf, application/json" }, body: JSON.stringify({ numeroFatura, prefer: "stream" }) });
  if (!r.ok) throw new Error("Erro " + r.status);
  const ct = (r.headers.get("content-type") || "").toLowerCase();
  if (ct.includes("application/pdf")) { const blob = await r.blob(); const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" }); const url = URL.createObjectURL(pdfBlob); return { kind: "blob", url, blob: pdfBlob }; }
  const data = await r.json().catch(() => null); if (data?.url) return { kind: "remote", url: data.url, blob: null };
  throw new Error("Resposta inesperada de /api/boleto");
}
async function proxyParaBlob(urlRemota) {
  const p = await fetch(API_BASE + "/api/boleto/proxy", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/pdf" }, body: JSON.stringify({ url: urlRemota }) });
  if (!p.ok) throw new Error("Proxy falhou: " + p.status); const blob = await p.blob(); const pdfBlob = blob.type === "application/pdf" ? blob : new Blob([blob], { type: "application/pdf" }); const url = URL.createObjectURL(pdfBlob); return { kind: "blob", url, blob: pdfBlob };
}
async function ensureBlob() {
  if (state.boletoAtual?.kind === "blob") return state.boletoAtual;
  if (state.boletoAtual?.kind === "remote" && state.boletoAtual.url) { const originalRemote = state.boletoAtual.url; const converted = await proxyParaBlob(originalRemote); revokeIfBlob(); state.boletoAtual = { ...state.boletoAtual, remoteUrl: originalRemote, ...converted }; return state.boletoAtual; }
  throw new Error("Nenhum boleto carregado");
}

// ====== FORMAT ======
function formatNomeCompleto(nome) { if (!nome) return "beneficiario"; return String(nome).trim().split(/\s+/).map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" "); }
function formatarNumeroFatura(v, fallback) { if (v == null) return fallback; if (typeof v === "string" && v.trim() === "") return fallback; return String(v); }
function escolherPrimeiroValor(obj, chaves, fallback = null) { for (const k of chaves) if (obj && obj[k] != null) return obj[k]; return fallback; }
function formatarDataBruta(v) { if (!v) return null; const s = String(v).trim(); if (/^\d{8}$/.test(s)) return s.slice(0,2)+"/"+s.slice(2,4)+"/"+s.slice(4); if (/^\d{4}-\d{2}-\d{2}/.test(s)) { const [a,m,d]=s.split("-"); return d+"/"+m+"/"+a; } return s; }
function formatarValorMonetario(v) { if (v == null) return null; const n = Number(String(v).replace(",", ".")); return Number.isFinite(n) ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : String(v); }
function preencherBeneficiario(beneficiario) { refs.nome.textContent = formatNomeCompleto(beneficiario && beneficiario.nome); const plano = ((beneficiario && (beneficiario.tipoPlano || beneficiario.tipoPessoa)) || "PF").toString().toUpperCase(); const descricao = plano === "PJ" ? "Pessoa Juridica" : "Pessoa Fisica"; refs.plano.textContent = plano + " - " + descricao; }

function limparFaturas() { state.faturas = []; state.boletoAtual = { numero: null, url: null }; refs.faturasLista.innerHTML = ""; refs.faturasResumo.textContent = ""; refs.instrucaoFaturas.textContent = ""; resetPDFPreview(); }
function resetPDFPreview() {
  refs.pdfContainer.innerHTML = '<div class="pdf-info"><div class="icon">📄</div><div><strong>Nenhuma fatura selecionada</strong></div><div style="font-size: 14px; margin-top: 8px;">Clique em uma fatura acima para ver as opções disponíveis</div></div>';
  refs.pdfLegenda.textContent = 'Selecione uma fatura para visualizar as opções'; refs.pdfActions.style.display = 'none'; refs.btnVisualizarBoleto.disabled = true; refs.btnEnviarEmail.disabled = true; refs.btnEnviarWhatsapp.disabled = true; refs.btnImprimirPdf.disabled = true; document.querySelectorAll('.fatura-btn').forEach((btn)=>btn.classList.remove('active'));
}
function showPDFError(message) { refs.pdfContainer.innerHTML = '<div class="pdf-error"><div style="font-size: 48px; margin-bottom: 16px;">❌</div><div><strong>Erro ao carregar o boleto</strong></div><div style="font-size: 14px; margin-top: 8px;">'+message+'</div></div>'; refs.pdfActions.style.display = 'none'; }

// ====== AÇÕES ======
async function visualizarBoleto() {
  try { await ensureBlob(); } catch (e) { showStatus(e.message || 'Falha ao preparar visualização.', 'err'); return; }
  const viewerUrl = state.boletoAtual.remoteUrl
    ? API_BASE + '/api/pdf?url=' + encodeURIComponent(state.boletoAtual.remoteUrl) + '&t=' + Date.now()
    : (state.boletoAtual.url + '#toolbar=1&navpanes=0&view=FitH');
  openModal(viewerUrl, state.boletoAtual.numero); 
  showStatus('Abrindo boleto para visualização...', 'ok');
}
function enviarPorEmail() { if (!state.boletoAtual.url) { showStatus('Nenhum boleto carregado para envio.', 'warn'); return; } showStatus('Funcionalidade de email em desenvolvimento.', 'warn'); }
function enviarPorWhatsApp() { if (!state.boletoAtual.url) { showStatus('Nenhum boleto carregado para envio.', 'warn'); return; } showStatus('Funcionalidade de WhatsApp em desenvolvimento.', 'warn'); }
async function imprimirPDF() {
  resetStatus(); if (!state.boletoAtual?.numero) { showStatus('Nenhum boleto carregado para impressão.', 'warn'); return; }
  try {
    setLoading(true);
    const remoteUrl = state.boletoAtual.remoteUrl || (state.boletoAtual.kind === 'remote' ? state.boletoAtual.url : null);
    const r = await fetch(API_BASE + '/api/boleto/print', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ numeroFatura: state.boletoAtual.numero, url: remoteUrl }) });
    const data = await r.json().catch(() => ({})); if (!r.ok || !data?.ok) throw new Error(data?.error || ('Falha ao imprimir: ' + r.status));
    showStatus(`Enviado para a impressora${data.printer ? ' (' + data.printer + ')' : ''}.`, 'ok'); return;
  } catch (err) {
    try { await ensureBlob(); } catch {}
    const iframe = document.createElement('iframe'); iframe.style.position = 'fixed'; iframe.style.right = '0'; iframe.style.bottom = '0'; iframe.style.width = '0'; iframe.style.height = '0'; iframe.style.border = '0';
    iframe.onload = function () { try { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); showStatus('Abrindo diálogo de impressão (modo local).', 'warn'); } finally { setTimeout(() => iframe.remove(), 3000); } };
    iframe.onerror = function () { showStatus('Nenhum local de impressão disponível.', 'err'); iframe.remove(); };
    iframe.src = state.boletoAtual.url; document.body.appendChild(iframe);
  } finally { setLoading(false); }
}

function validatePJInputs() {
  const cnpj = digits((refs.cnpjInput ? refs.cnpjInput.value : '') || '');
  const contrato = digits((refs.contratoInput ? refs.contratoInput.value : '') || '');
  const cnpjOk = cnpj.length === 14;
  if (refs.contratoGroup) refs.contratoGroup.style.display = cnpjOk ? 'block' : 'none';
  const btn = refs.btnContrato;
  if (btn) btn.disabled = !(cnpjOk && contrato.length > 0);
  return { cnpj, contrato, ready: cnpjOk && contrato.length > 0 };
}

async function acionarBuscaFaturas() {
  resetStatus();
  const contrato = digits(state.contratoInformado || '');
  if (!contrato) { showStatus('Informe o numero do contrato para prosseguir.', 'warn'); return; }
  try {
    setLoading(true);
    const cpfCnpj = state.beneficiario.tipoPessoa === 'PJ' ? digits(state.cnpjInformado || refs.cnpjInput.value) : state.beneficiario.documento;
    const lista = await buscarFaturas(cpfCnpj, contrato);
    state.faturas = lista;
    renderizarFaturas(lista);
    setStep('step-faturas');
  } catch (error) { showStatus(error.message || 'Falha ao buscar faturas.', 'err'); }
  finally { setLoading(false); }
}

function resetFlow() {
  resetStatus();
  refs.cpfInput.value = '';
  refs.contratoInput.value = '';
  if (refs.cnpjInput) refs.cnpjInput.value = '';
  if (refs.contratoGroup) refs.contratoGroup.style.display = 'none';
  limparFaturas();
  Object.assign(state, { beneficiario: null, servicoSelecionado: null, contratoInformado: null, cnpjInformado: null, faturas: [], boletoAtual: { numero: null, url: null } });
  setStep('step-cpf');
  refs.cpfInput.focus();
}

async function handleLookup() {
  resetStatus();
  const cpf = digits(refs.cpfInput.value);
  if (cpf.length !== 11) { showStatus('Digite um CPF valido com 11 numeros.', 'warn'); return; }
  try {
    setLoading(true);
    const dados = await lookupByCpf(cpf);
    state.beneficiario = dados;
    preencherBeneficiario(dados);
    limparFaturas();
    setStep('step-servicos');
    showStatus(`Bem vindo, ${formatNomeCompleto(dados.nome)}.`, 'ok');
  } catch (error) { showStatus(error.message || 'Nao foi possivel validar o CPF.', 'err'); }
  finally { setLoading(false); }
}

function handleServicoSelecionado(servico) {
  state.servicoSelecionado = servico;
  if (servico !== 'boletos') { showStatus('Este servico ainda esta em desenvolvimento.', 'warn'); return; }
  const { beneficiario } = state;
  if (!beneficiario) { showStatus('Valide um CPF antes de escolher o servico.', 'warn'); setStep('step-cpf'); return; }
  if (beneficiario.tipoPessoa === 'PJ') {
    state.contratoInformado = null;
    refs.contratoInput.value = '';
    if (refs.cnpjInput) refs.cnpjInput.value = '';
    if (refs.contratoGroup) refs.contratoGroup.style.display = 'none';
    setStep('step-contrato');
    refs.contratoInput.focus();
  } else {
    state.contratoInformado = digits(beneficiario.contrato || beneficiario.documento);
    acionarBuscaFaturas();
  }
}

// ====== UI ======
function renderizarFaturas(faturas) {
  const tbody = refs.faturasLista; tbody.innerHTML = '';
  if (!faturas || !faturas.length) { refs.faturasResumo.textContent = 'Nenhuma fatura em aberto foi encontrada para o contrato informado.'; refs.instrucaoFaturas.textContent = 'Verifique os dados informados ou tente novamente mais tarde.'; resetPDFPreview(); return; }
  refs.faturasResumo.textContent = 'Encontramos ' + faturas.length + ' fatura' + (faturas.length > 1 ? 's' : '') + ' em aberto.'; refs.instrucaoFaturas.textContent = 'Toque em uma fatura para carregar o boleto e escolher uma opção.';
  faturas.forEach((f, i) => { const numero = formatarNumeroFatura(escolherPrimeiroValor(f, ['numeroFatura','numerofatura','numerofaturacontrole','numero']), String(i+1).padStart(2,'0')); const venc = formatarDataBruta(escolherPrimeiroValor(f, ['vencimento','vencimentofatura','dataVencimento','data_vencimento'])); const valor = formatarValorMonetario(escolherPrimeiroValor(f, ['valor','valorfatura','valor_fatura','valorComDesconto'])); const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'fatura-btn'; btn.dataset.numeroFatura = numero; btn.innerHTML = '<strong>Fatura ' + numero + '</strong><span>Vencimento: ' + (venc || 'N/D') + '</span><span>Valor: ' + (valor || 'N/D') + '</span>'; btn.addEventListener('click', () => abrirBoleto(numero, btn)); tbody.appendChild(btn); });
  refs.pdfPreview.style.display = 'block'; resetPDFPreview();
}
async function abrirBoleto(numeroFatura, buttonElement) {
  resetStatus(); if (!numeroFatura) { showStatus('Numero de fatura invalido.', 'warn'); return; }
  document.querySelectorAll('.fatura-btn').forEach((btn) => btn.classList.remove('active')); if (buttonElement) buttonElement.classList.add('active');
  try {
    setLoading(true); refs.pdfLegenda.textContent = 'Carregando boleto da fatura ' + numeroFatura; refs.pdfContainer.innerHTML = '<div class="pdf-info"><div class="icon">⏳</div><div><strong>Carregando boleto...</strong></div><div style="font-size: 14px; margin-top: 8px;">Aguarde enquanto buscamos o boleto</div></div>';
    const result = await buscarBoleto(numeroFatura); revokeIfBlob(); state.boletoAtual = { numero: numeroFatura, ...result }; try { await ensureBlob(); } catch {}
    renderPreviewIfPossible(); refs.pdfLegenda.textContent = `Boleto da fatura ${numeroFatura} pronto para visualização/impressão`;
    refs.pdfActions.style.display = 'block'; refs.btnVisualizarBoleto.disabled = false; refs.btnEnviarEmail.disabled = false; refs.btnEnviarWhatsapp.disabled = false; refs.btnImprimirPdf.disabled = false; showStatus('Boleto carregado com sucesso!', 'ok');
  } catch (e) { console.error('Erro ao carregar boleto:', e); showPDFError(e.message || 'Falha ao carregar o boleto. Tente novamente.'); showStatus(e.message || 'Falha ao carregar o boleto.', 'err'); }
  finally { setLoading(false); }
}

// ====== INIT ======
refs.pdfPreview.style.display = 'block';
window.appState = state;
window.appRefs = refs;

// ====== EVENTS ======
refs.btnValidarCpf.addEventListener('click', handleLookup);
refs.cpfInput.addEventListener('keyup', (event) => { if (event.key === 'Enter') handleLookup(); });
document.querySelectorAll('[data-servico]').forEach((button) => { button.addEventListener('click', () => handleServicoSelecionado(button.dataset.servico)); });
refs.btnTrocarCpf.addEventListener('click', resetFlow);
refs.btnVoltarServicos.addEventListener('click', () => { resetStatus(); setStep('step-servicos'); });
refs.btnContrato.addEventListener('click', () => { if (state.beneficiario && state.beneficiario.tipoPessoa === 'PJ') { const { cnpj, contrato, ready } = validatePJInputs(); state.cnpjInformado = cnpj; state.contratoInformado = contrato; if (!ready) { showStatus('Informe CNPJ (14 digitos) e contrato.', 'warn'); return; } } else { state.contratoInformado = digits(refs.contratoInput.value); } acionarBuscaFaturas(); });
refs.contratoInput.addEventListener('keyup', (event) => { if (state.beneficiario && state.beneficiario.tipoPessoa === 'PJ') validatePJInputs(); if (event.key === 'Enter') { if (state.beneficiario && state.beneficiario.tipoPessoa === 'PJ') { const { ready } = validatePJInputs(); if (!ready) { showStatus('Informe CNPJ (14 digitos) e contrato.', 'warn'); return; } } acionarBuscaFaturas(); } });
refs.btnVisualizarBoleto.addEventListener('click', visualizarBoleto);
refs.btnEnviarEmail.addEventListener('click', enviarPorEmail);
refs.btnEnviarWhatsapp.addEventListener('click', enviarPorWhatsApp);
refs.btnImprimirPdf.addEventListener('click', imprimirPDF);
refs.modalClose.addEventListener('click', closeModal);
refs.pdfModal.addEventListener('click', (e) => { if (e.target === refs.pdfModal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && refs.pdfModal.style.display === 'block') closeModal(); });
refs.btnNovoDocumento.addEventListener('click', resetFlow);

// ====== EVENTS ======
refs.btnValidarCpf.addEventListener('click', handleLookup);
refs.cpfInput.addEventListener('keyup', (event) => { if (event.key === 'Enter') handleLookup(); });
document.querySelectorAll('[data-servico]').forEach((button) => { button.addEventListener('click', () => handleServicoSelecionado(button.dataset.servico)); });
refs.btnTrocarCpf.addEventListener('click', resetFlow);
refs.btnVoltarServicos.addEventListener('click', () => { resetStatus(); setStep('step-servicos'); });
refs.btnContrato.addEventListener('click', () => { if (state.beneficiario && state.beneficiario.tipoPessoa === 'PJ') { const { cnpj, contrato, ready } = validatePJInputs(); state.cnpjInformado = cnpj; state.contratoInformado = contrato; if (!ready) { showStatus('Informe CNPJ (14 digitos) e contrato.', 'warn'); return; } } else { state.contratoInformado = digits(refs.contratoInput.value); } acionarBuscaFaturas(); });
refs.contratoInput.addEventListener('keyup', (event) => { if (state.beneficiario && state.beneficiario.tipoPessoa === 'PJ') validatePJInputs(); if (event.key === 'Enter') { if (state.beneficiario && state.beneficiario.tipoPessoa === 'PJ') { const { ready } = validatePJInputs(); if (!ready) { showStatus('Informe CNPJ (14 digitos) e contrato.', 'warn'); return; } } acionarBuscaFaturas(); } });
refs.btnVisualizarBoleto.addEventListener('click', visualizarBoleto);
refs.btnEnviarEmail.addEventListener('click', enviarPorEmail);
refs.btnEnviarWhatsapp.addEventListener('click', enviarPorWhatsApp);
refs.btnImprimirPdf.addEventListener('click', imprimirPDF);
refs.modalClose.addEventListener('click', closeModal);
refs.pdfModal.addEventListener('click', (e) => { if (e.target === refs.pdfModal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && refs.pdfModal.style.display === 'block') closeModal(); });
refs.btnNovoDocumento.addEventListener('click', resetFlow);
