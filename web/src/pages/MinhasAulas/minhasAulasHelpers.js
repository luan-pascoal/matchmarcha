// Data local -> "AAAA-MM-DD", sem passar por UTC (evita deslocar o dia)
export function chaveData(data){

    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${data.getFullYear()}-${mes}-${dia}`;

}

// Remove acentos e converte para minúsculas (autocomplete de aluno e cidade)
export function normalizar(texto){
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// HH:MM de 00:00 a 23:59
export const PADRAO_HORARIO = /^([01]\d|2[0-3]):[0-5]\d$/

export const OPCOES_HORARIO = Array.from({ length: 24}, (_, hora) => 
    `${String(hora).padStart(2, "0")}:00`
);

// "09:30" ou "09:30:00" -> minutos desde a meia-noite
export function horarioParaMinutos(horario) {

    const[hora, minuto] = horario.split(":").map(Number);
    return hora*60 + minuto;

}

// Próxima hora cheia: 8:40 -> "09:00", 9:00 -> "09:00"
export function proximaHoraCheia(agora = new Date){

    const minutos = agora.getHours() * 60 + agora.getMinutes();
    const hora = Math.ceil(minutos/60) % 24;
    return `${String(hora).padStart(2, "0")}:00`;

}

// Períodos ocupados por aulas não canceladas de uma data (ignora uma aula, se informada)
export function intervalosOcupados(aulas, data, ignorarAulaId = null){

    return aulas
        .filter((aula) => 
            aula.Au_data === data &&
            aula.Au_status != 'CANCELADA' &&
            aula.Au_id !== ignorarAulaId
        )
        .map((aula) => ({
            inicio: horarioParaMinutos(aula.Au_horario_inicio),
            fim: horarioParaMinutos(aula.Au_horario_fim),
        }));

}

// Início bloqueado quando: inicio_existente <= início < fim_existente
export function inicioBloqueado(inicio, ocupados){
    return ocupados.some((ocupado) => ocupado.inicio <= inicio && inicio < ocupado.fim);
}

// Nova aula [inicio, fim) conflita com [c, d) quando inicio < d e fim > c
export function haSobreposicao(inicio, fim, ocupados){
    return ocupados.some((ocupado) => inicio < ocupado.fim && fim > ocupado.inicio);
}

// Mensagens de erro dos horários digitados (vazio = sem erro)
export function validarHorarios({ inicio, fim, ocupados }){

    let erroInicio = "";
    let erroFim = "";

    const inicioValido = PADRAO_HORARIO.test(inicio);
    const fimValido = PADRAO_HORARIO.test(fim);

    // O erro de formato só aparece com 5 caracteres, para não atrapalhar enquanto digita
    if(inicio.length === 5 && !inicioValido){
        erroInicio = "Use o formato HH:mm, de 00:00 a 23:59";
    }else if (inicioValido && inicioBloqueado(horarioParaMinutos(inicio), ocupados)){
        erroInicio = "Esse horário já está ocupado por outra aula.";
    }

    if(fim.length === 5 && !fimValido){
        erroFim = "Use o formato HH:mm, de 00:00 a 23:59";
    }else if (fimValido && inicioValido){

        const minutosInicio = horarioParaMinutos(inicio);
        const minutosFim = horarioParaMinutos(fim);
        if(minutosFim <= minutosInicio){
            erroFim = "O horário de término precisa ser posterior ao de início.";
        }else if(haSobreposicao(minutosInicio, minutosFim, ocupados)){
            erroFim = "Esse período conflita com uma aula já marcada.";
        }
    }

    return { erroInicio, erroFim};
    
}

export const ROTULOS_STATUS = {
  AGENDADA: "Agendada",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};