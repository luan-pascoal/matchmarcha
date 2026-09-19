// Funções utilitárias usadas por mais de um component da tela de Chat

export function normalizar(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function formatarHora(dataISO) {
  return new Date(dataISO.replace(" ", "T")).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarDiaSeparador(dataISO) {
  return new Date(dataISO.replace(" ", "T")).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
}

function ehMesmoDiaCalendario(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// "Hoje" / "Ontem" quando fizer sentido, senão cai no formato de data normal
export function formatarRotuloData(dataISO) {
  const data = new Date(dataISO.replace(" ", "T"));
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(hoje.getDate() - 1);

  if (ehMesmoDiaCalendario(data, hoje)) return "Hoje";
  if (ehMesmoDiaCalendario(data, ontem)) return "Ontem";
  return formatarDiaSeparador(dataISO);
}

export function mesmaData(a, b) {
  return a.slice(0, 10) === b.slice(0, 10);
}

// Verifica se uma mensagem ainda está dentro da janela de 30 minutos
// permitida para edição/exclusão para todos, com base em Msg_datacriacao
export function dentroDoPrazoEdicao(dataISO) {
  const dataCriacao = new Date(dataISO.replace(" ", "T"));
  const minutosPassados = (Date.now() - dataCriacao.getTime()) / 60000;
  return minutosPassados <= 30;
}