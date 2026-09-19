import { useForm } from "react-hook-form";
import { useState, useMemo } from "react";
import { Popup } from "../../../components/popup/Popup";
import { MsgErrosBackEnd } from "../../../components/MsgErrosBackEnd";
import axios from "axios";
import './SolicitarAula.css'

export function SolicitarAula({ aberto, onFechar, handleSolicitarAula, cidades, instrutor}) {

    // useMemo() => hook que memoriza o resultado de um cálculo, evitando que ele seja refeito
    // em toda re-renderização do componente - só recalcula quando as depêndencias mudam

    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm();

    const [arrayErrosBackend, setArrayErrosBackend] = useState([]);
    const [cidadeBusca, setCidadeBusca] = useState("");
    const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

    const normalizar = (texto) =>
        texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const cidadesFiltradas = (cidades ?? []).filter((cidade) =>
        normalizar(cidade.nome).includes(normalizar(cidadeBusca))
    ).slice(0, 10);

    const categoriasDisponiveis = useMemo(() => {

        if (instrutor?.tipo === 'AB') return ["A", "B", "AB"];
        if (instrutor?.tipo === 'A') return ["A"];
        if (instrutor?.tipo === 'B') return ["B"];
        return [];

    }, [instrutor?.tipo]);

    const periodosDisponiveis = useMemo(() => {

        return (instrutor?.periodos ?? []).map((p) => p.nome);

    }, [instrutor?.periodos]);

    const LABELS_CATEGORIA = {
        A: "A (Somente Moto)",
        B: "B (Somente Carro)",
        AB: "AB (Moto e Carro)",
    };

    const onSubmit = async (data) => {

        const resposta = await axios.post('/api/solicitacoes', {
            categoria: data.categoria,
            periodo: data.periodo,
            cidade: data.cidade_id,
            instrutorId : instrutor.idIns
        }, {
            headers: {
                "Content-Type": "application/json"
            },
            validateStatus: () => true,
            withCredentials: true
        })

        if (resposta.status === 200 && resposta.data.Sucesso === true) {
            setArrayErrosBackend([]);
            handleSolicitarAula("Solicitação enviada com sucesso!");
            return;
        }

        if (resposta.status === 422) {
            const errosBackend = resposta.data.Erro;
            const array = Object.entries(errosBackend);
            setArrayErrosBackend(array);
            return;
        }
    }

    return (
        <>
            <Popup aberto={aberto} onFechar={onFechar} titulo="Solicitar Aula">

                <p className="solicitacao-intro">
                    Ao enviar essa solicitação, o instrutor vai analisar seus requisitos e
                    conferir a disponibilidade na agenda dele. Caso ele aceite, um chat será
                    aberto entre vocês para combinar os próximos passos.
                </p>

                <form className="form-solicitacao" onSubmit={handleSubmit(onSubmit)}>

                    <div className="field">
                        <label className="label" htmlFor="categoria">Categoria</label>
                        <select
                            id="categoria"
                            className={`form-solicitacao__select ${errors?.categoria ? 'form-solicitacao__select--invalido' : ''}`}
                            defaultValue="0"
                            {...register('categoria', {
                                validate: (value) => value !== '0'
                            })}
                        >
                            <option value="0">Selecione a categoria desejada</option>
                            {categoriasDisponiveis.map((categoria) => (
                                <option key={categoria} value={categoria}>
                                    {LABELS_CATEGORIA[categoria]}
                                </option>
                            ))}
                        </select>
                        {errors?.categoria?.type === 'validate' && (
                            <p className="error-message">
                                Selecione pelo menos uma categoria.
                            </p>
                        )}
                        {categoriasDisponiveis.length === 0 && (
                            <p className="hint">
                                Este instrutor ainda não informou as categorias que leciona.
                            </p>
                        )}
                    </div>

                    <div className="field">
                        <label className="label">Período</label>
                        <div className="periodo-opcoes">
                            {periodosDisponiveis.map((periodo) => (
                                <label className="periodo-opcao" key={periodo}>
                                    <input
                                        className="periodo-opcao__input"
                                        type="radio"
                                        value={periodo}
                                        {...register('periodo', {
                                            required: true
                                        })}
                                    />
                                    {periodo}
                                </label>
                            ))}
                        </div>
                        {errors?.periodo?.type === 'required' && (
                            <p className="error-message">
                                Selecione um período.
                            </p>
                        )}
                        {periodosDisponiveis.length === 0 && (
                            <p className="hint">
                                Este instrutor ainda não informou os períodos disponíveis.
                            </p>
                        )}
                    </div>

                    <div className="field">
                        <label className="label" htmlFor="cidade">Cidade</label>
                        <div className="autocomplete">
                            <input
                                id="cidade"
                                className="input"
                                type="text"
                                placeholder="Digite a sua cidade"
                                autoComplete="off"
                                value={cidadeBusca}
                                onChange={(event) => {
                                    setCidadeBusca(event.target.value);
                                    setMostrarSugestoes(true);
                                    setValue("cidade_id", "");
                                }}
                            />
                            <input
                                type="hidden"
                                {...register("cidade_id", { required: true })}
                            />
                            {mostrarSugestoes
                                && cidadeBusca.length > 0
                                && cidadesFiltradas.length > 0
                                && (
                                    <ul className="cidade-autocomplete__list">
                                        {cidadesFiltradas.map((cidade) => (
                                            <li
                                                key={cidade.id}
                                                className="cidade-autocomplete__item"
                                                onClick={(event) => {
                                                    event.preventDefault();
                                                    setCidadeBusca(`${cidade.nome} - ${cidade.uf}`);
                                                    setValue("cidade_id", cidade.id);
                                                    setMostrarSugestoes(false);
                                                }}
                                            >
                                                {cidade.nome} - {cidade.uf}
                                            </li>
                                        ))}
                                    </ul>
                                )
                            }
                        </div>
                        {errors?.cidade_id?.type === 'required' && (
                            <p className="error-message">O campo cidade é obrigatório.</p>
                        )}
                    </div>

                    <MsgErrosBackEnd arrayErrosBackend={arrayErrosBackend} />

                    <div className="solicitar-aula__rodape">
                        <button type="button" className="btn btn--ghost" onClick={onFechar}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn--primary" disabled={isSubmitting}>
                            {isSubmitting ? "Enviando..." : "Enviar solicitação"}
                        </button>
                    </div>

                </form>
            </Popup>
        </>
    );
}

