import { useState } from "react";
import { useForm } from 'react-hook-form';
import { MsgErrosBackEnd } from "../../components/MsgErrosBackEnd";
import { Popup } from "../../components/popup/Popup";
import Carro from '../../assets/images/icons/carro.png';
import Moto from '../../assets/images/icons/Moto.png';
import axios from 'axios';
import './MeusVeiculos.css';

/*

Atributos de um tipo de input select:
Imagine o seguinte select:
<select>
    <option value="59">Chevrolet</option> => index 0
    <option value="102">Fiat</option>     => index 1
    <option value="190">Honda</option>    => index 2
</select>

Imagine que o usuário selecionou Fiat
e.target.value => "102"
e.target.selectedIndex => 1
e.target.options => lista de todas as options do select
e.target.options[1] => o elemento <option value="102">Fiat</option>
e.target.options[1].text => "Fiat"
*/

const ETAPAS = [
    { id: 1, titulo: 'Tipo', campos: [] },
    { id: 2, titulo: 'Veículo', campos: ['marcaId', 'modeloId', 'anoId'] },
    { id: 3, titulo: 'Detalhes', campos: ['cambio', 'direcao', 'cor'] },
];

const TITULOS = {
    1: 'Adicionar veículo',
    2: 'Marca, modelo e ano',
    3: 'Detalhes do veículo',
};

const TIPO_FIPE = {
    C: 'cars',
    M: 'motorcycles'
};

export function PopupAdicionar({ recarregarVeiculos, aberto, onFechar, cores, handleAdicaoSucesso, dadosUsuario }) {

    const [etapaAtual, setEtapaAtual] = useState(1);
    const [tipo, setTipo] = useState(null);
    const [arrayErrosBackend, setArrayErrosBackend] = useState([]);

    const [marcas, setMarcas] = useState([]);
    const [modelos, setModelos] = useState([]);
    const [anos, setAnos] = useState([]);
    const [carregandoMarcas, setCarregandoMarcas] = useState(false);
    const [carregandoModelos, setCarregandoModelos] = useState(false);
    const [carregandoAnos, setCarregandoAnos] = useState(false);

    const { register, handleSubmit, trigger, setValue, getValues, reset, formState: { errors } } = useForm();

    const resetar = () => {
        setEtapaAtual(1);
        setTipo(null);
        setMarcas([]);
        setModelos([]);
        setAnos([]);
        onFechar();
        reset();
    };

    const trocarTipo = (novoTipo) => {
        setTipo(novoTipo);
        setMarcas([]);
        setModelos([]);
        setAnos([]);
        reset(); 
        carregarMarcas(novoTipo);
        proximaEtapa();
    };

    const etapaAnterior = () => {
        setEtapaAtual((n) => Math.max(1, n - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const proximaEtapa = async () => {
        const campos = ETAPAS[etapaAtual - 1].campos;
        const valido = await trigger(campos);
        if (valido) {
            setEtapaAtual((n) => Math.min(ETAPAS.length, n + 1));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const onSubmit = async (data) => {
        const resposta = await axios.post('/api/veiculos', {
            tipo: tipo,
            marcaNome: data.marcaNome,
            modeloNome: data.modeloNome,
            anoNome: data.anoNome,
            cambio: data.cambio,
            direcao: data.direcao,
            cor: data.cor,
            pedalAux: data.pedalAux,
            cilindrada: data.cilindrada
        }, {
            headers: {
                "Content-Type": "application/json"
            },
            validateStatus: () => true,
            withCredentials: true
        })

        if (resposta.status === 200 && resposta.data.sucesso === true) {
            setArrayErrosBackend([]);
            await recarregarVeiculos(dadosUsuario.idIns);
            handleAdicaoSucesso("Veículo cadastrado com sucesso!");
            resetar();
            return;
        }

        if (resposta.status === 422) {
            const errosBackend = resposta.data.Erro;
            const array = Object.entries(errosBackend);
            setArrayErrosBackend(array);
            resetar();
            return;
        }
    };

    const carregarMarcas = async (tipoSelecionado) => {

        setCarregandoMarcas(true);
        setMarcas([]);
        setModelos([]);
        setAnos([]);

        const resposta = await axios.get(`/api/fipe/marcas/${TIPO_FIPE[tipoSelecionado]}`, {
            validateStatus: () => true,
            withCredentials: true
        });

        if (resposta.status === 200) {
            setMarcas(resposta.data);
            setCarregandoMarcas(false);
        }

        if (resposta.status === 422) {
            const errosBackend = resposta.data.Erro;
            const array = Object.entries(errosBackend);
            setArrayErrosBackend(array);
            setCarregandoMarcas(false);
        }
    };

    const carregarModelos = async (marcaId) => {

        setCarregandoModelos(true);
        setModelos([]);
        setAnos([]);

        const resposta = await axios.get(`/api/fipe/modelos/${TIPO_FIPE[tipo]}/${marcaId}`, {
            validateStatus: () => true,
            withCredentials: true
        });

        if (resposta.status === 200) {
            setModelos(resposta.data);
            setCarregandoModelos(false);
            setArrayErrosBackend([]);
        }

        if (resposta.status === 422) {
            const errosBackend = resposta.data.Erro;
            const array = Object.entries(errosBackend);
            setArrayErrosBackend(array);
            setCarregandoModelos(false);
        }
    };

    const carregarAnos = async (marcaId, modeloId) => {

        setCarregandoAnos(true);
        setAnos([]);

        const resposta = await axios.get(`/api/fipe/anos/${TIPO_FIPE[tipo]}/${marcaId}/${modeloId}`, {
            validateStatus: () => true,
            withCredentials: true
        });

        if (resposta.status === 200) {
            setAnos(resposta.data);
            setCarregandoAnos(false);
        }

        if (resposta.status === 422) {
            const errosBackend = resposta.data.Erro;
            const array = Object.entries(errosBackend);
            setArrayErrosBackend(array);
            setCarregandoAnos(false);
        }
    };

    return (
        <Popup aberto={aberto} onFechar={resetar} titulo={TITULOS[etapaAtual]}>

            <ol className="stepper" aria-label="Progresso do cadastro">
                {ETAPAS.map((etapa) => {
                    const concluida = etapa.id < etapaAtual;
                    const ativa = etapa.id === etapaAtual;
                    return (
                        <div
                            key={etapa.id}
                            className={[
                                'stepper__item',
                                concluida ? 'stepper__item--concluido' : '',
                                ativa ? 'stepper__item--ativo' : '',
                            ].join(' ')}
                            aria-current={ativa ? 'step' : undefined}
                        >
                            <span className="stepper__num">{etapa.id}</span>
                            <span className="stepper__label">{etapa.titulo}</span>
                        </div>
                    );
                })}
            </ol>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>

                {/* ── Etapa 1: Tipo ── */}
                {etapaAtual === 1 && (
                    <div className="popup-tipo">
                        <p className="popup-tipo__pergunta">O que você quer cadastrar?</p>
                        <div className="popup-tipo__opcoes">
                            <button
                                type="button"
                                className={`popup-tipo__btn ${tipo === 'C' ? 'popup-tipo__btn--ativo' : ''}`}
                                onClick={() => {
                                    trocarTipo('C')
                                }}
                            >
                                <img className="popup-tipo__icone" src={Carro} alt="Carro" />
                                <span>Carro</span>
                            </button>
                            <button
                                type="button"
                                className={`popup-tipo__btn ${tipo === 'M' ? 'popup-tipo__btn--ativo' : ''}`}
                                onClick={() => {
                                    trocarTipo('M')
                                }}
                            >
                                <img className="popup-tipo__icone" src={Moto} alt="Moto" />
                                <span>Moto</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Etapa 2: Marca / Modelo / Ano ── */}
                {etapaAtual === 2 && (
                    <div className="stack">
                        <input type="hidden" {...register('marcaNome')} />
                        <input type="hidden" {...register('modeloNome')} />
                        <input type="hidden" {...register('anoNome')} />
                        <div className="field">
                            <label className="label" htmlFor="marcaId">Marca</label>
                            <select
                                id="marcaId"
                                className="input"
                                disabled={carregandoMarcas}
                                defaultValue=""
                                {...register('marcaId', { validate: (v) => v !== '' })}
                                onChange={(event) => {
                                    const id = event.target.value;
                                    const nome = event.target.options[event.target.selectedIndex].text;
                                    setValue('marcaId', id);
                                    setValue('marcaNome', nome);
                                    carregarModelos(id);
                                }}
                            >
                                <option value="" disabled>
                                    {carregandoMarcas ? 'Carregando...' : 'Selecione a marca...'}
                                </option>
                                {marcas.map((m) => (
                                    <option
                                        key={m.code}
                                        value={m.code}
                                    >
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                            {errors?.marcaId?.type === 'required' && (
                                <p className="error-message">Marca é obrigatória.</p>
                            )}
                        </div>
                        <div className="field">
                            <label className="label" htmlFor="modeloId">Modelo</label>
                            <select
                                id="modeloId"
                                className="input"
                                disabled={carregandoModelos}
                                defaultValue=""
                                {...register('modeloId', { validate: (value) => value !== '' })}
                                onChange={(event) => {
                                    const id = event.target.value;
                                    const nome = event.target.options[event.target.selectedIndex].text;
                                    const marcaId = getValues('marcaId');
                                    setValue('modeloId', id);
                                    setValue('modeloNome', nome);
                                    carregarAnos(marcaId, id);
                                }}
                            >
                                <option value="" disabled>
                                    {carregandoMarcas ? 'Carregando...' : 'Selecione o modelo...'}
                                </option>
                                {modelos.map((m) => (
                                    <option
                                        key={m.code}
                                        value={m.code}
                                    >
                                        {m.name}
                                    </option>
                                ))}
                            </select>
                            {errors?.modeloId && (
                                <p className="error-message">Modelo é obrigatório.</p>
                            )}
                        </div>
                        <div className="field">
                            <label className="label" htmlFor="anoId">Ano</label>
                            <select
                                id="anoId"
                                className="input"
                                disabled={carregandoAnos || anos.length === 0}
                                defaultValue=""
                                {...register('anoId', { validate: (value) => value !== '' })}
                                onChange={(event) => {
                                    const nome = event.target.options[event.target.selectedIndex].text;
                                    setValue('anoNome', nome);
                                }}
                            >
                                <option value="" disabled>
                                    {carregandoAnos ? 'Carregando...' : 'Selecione o ano do veículo...'}
                                </option>
                                {anos.map((a) => (
                                    <option
                                        key={a.code}
                                        value={a.code}
                                    >
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                            {errors?.anoId && (
                                <p className="error-message">Ano é obrigatório.</p>
                            )}
                        </div>
                        <div className="popup__rodape">
                            <button type="button" className="btn btn--ghost btn--square" onClick={etapaAnterior}>Voltar</button>
                            <button type="button" className="btn btn--primary btn--square" onClick={proximaEtapa}>Continuar</button>
                        </div>
                    </div>
                )}

                {/* ── Etapa 3: Detalhes ── */}
                {etapaAtual === 3 && (
                    <div className="stack">
                        <div className="field">
                            <label className="label" htmlFor="cambio">Câmbio</label>
                            <select
                                id="cambio"
                                className="input"
                                defaultValue=""
                                {...register('cambio', { validate: (value) => value !== '' })}
                            >
                                <option value="" disabled>Selecione...</option>
                                <option>Manual</option>
                                <option>Automático</option>
                                <option>CVT</option>
                                <option>Semi-automático</option>
                            </select>
                            {errors?.cambio?.type === 'validate' && (
                                <p className="error-message">Câmbio é obrigatório.</p>
                            )}
                        </div>
                        <div className="field">
                            <label className="label" htmlFor="direcao">Direção</label>
                            <select
                                id="direcao"
                                className="input"
                                defaultValue=""
                                {...register('direcao', { validate: (value) => value !== '' })}
                            >
                                <option value="" disabled>Selecione...</option>
                                <option>Hidráulica</option>
                                <option>Elétrica</option>
                                <option>Mecânica</option>
                                <option>Eletro-hidráulica</option>
                            </select>
                            {errors?.direcao?.type === 'validate' && (
                                <p className="error-message">Direção é obrigatória.</p>
                            )}
                        </div>
                        <div className="field">
                            <label className="label" htmlFor="cor">Cor</label>
                            <select
                                id="cor"
                                className="input"
                                defaultValue=""
                                {...register('cor', { validate: (value) => value !== '' })}
                            >
                                <option value="" disabled>Selecione a cor...</option>
                                {(cores).map((cor) => (
                                    <option key={cor.id} value={cor.nome}>
                                        {cor.nome}
                                    </option>
                                ))}
                            </select>
                            {errors?.cor?.type === 'validate' && (
                                <p className="error-message">Cor é obrigatória.</p>
                            )}
                        </div>
                        {tipo === 'C' && (
                            <div className="field">
                                <span className="label">Pedal auxiliar</span>
                                <label className="toggle">
                                    <input
                                        type="checkbox"
                                        id="pedalAux"
                                        className="toggle__input"
                                        {...register('pedalAux')}
                                    />
                                    <span className="toggle__track">
                                        <span className="toggle__thumb" />
                                    </span>
                                    <span className="toggle__label-texto">Possui pedal auxiliar</span>
                                </label>
                            </div>
                        )}
                        {tipo === 'M' && (
                            <div className="field">
                                <label className="label" htmlFor="cilindrada">Cilindrada (cc)</label>
                                <input
                                    id="cilindrada"
                                    className="input"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder="Ex: 160"
                                    {...register('cilindrada', {
                                        required: tipo === 'M',
                                        min: 50,
                                        max: 2000,
                                        onChange: (event) => {
                                            event.target.value = event.target.value.replace(/\D/g, '');
                                        },
                                    })}
                                />
                                {errors?.cilindrada?.type === 'required' && (
                                    <p className="error-message">Cilindrada é obrigatória.</p>
                                )}
                                {(errors?.cilindrada?.type === 'min' || errors?.cilindrada?.type === 'max') && (
                                    <p className="error-message">Cilindrada deve ser entre 50 e 2000 cc.</p>
                                )}
                            </div>
                        )}
                        <MsgErrosBackEnd arrayErrosBackend={arrayErrosBackend} />
                        <div className="popup__rodape">
                            <button type="button" className="btn btn--ghost btn--square" onClick={etapaAnterior}>Voltar</button>
                            <button type="submit" className="btn btn--primary btn--square">Cadastrar veículo</button>
                        </div>
                    </div>
                )}

            </form>
        </Popup>
    );
}