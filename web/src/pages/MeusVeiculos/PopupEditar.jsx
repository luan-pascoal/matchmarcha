import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Popup } from "../../components/popup/Popup";
import { MsgErrosBackEnd } from "../../components/MsgErrosBackEnd";
import axios from "axios";
import "./MeusVeiculos.css";
import Carro from "../../assets/images/icons/carro.png";
import Moto from "../../assets/images/icons/moto.png";

export function PopupEditar({
  aberto,
  onFechar,
  veiculo,
  cores,
  recarregarVeiculos,
  handleEdicaoSucesso,
  dadosUsuario,
}) {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm();

  const [arrayErrosBackend, setArrayErrosBackend] = useState([]);
  const [enviando, setEnviando] = useState(false);

  const salvar = async (data) => {
    if (!isDirty) {
      handleEdicaoSucesso("Todos os dados estão salvos!");
      setEnviando(false);
      return;
    }

    setEnviando(true);

    const resposta = await axios.put(
      `/api/veiculos/${veiculo.id}`,
      {
        cor: data.cor,
        pedalAux: data.pedalAux,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        validateStatus: () => true,
        withCredentials: true,
      },
    );

    if (resposta.status === 200 && resposta.data.sucesso === true) {
      setArrayErrosBackend([]);
      await recarregarVeiculos(dadosUsuario.idIns);
      setEnviando(false);
      handleEdicaoSucesso("Veículo atualizado com sucesso!");
      return;
    }

    if (resposta.status === 422) {
      const errosBackend = resposta.data.Erro;
      const array = Object.entries(errosBackend);
      setArrayErrosBackend(array);
      setEnviando(false);
      return;
    }
  };

  useEffect(() => {
    if (!veiculo) return;

    reset({
      pedalAux: veiculo.pedalAux === "S" ? true : false,
      cor: veiculo.cor,
    });

  }, [veiculo, reset]);

  if (!veiculo) return null;

  const isMoto = veiculo.tipo === "M";

  return (
    <Popup aberto={aberto} onFechar={onFechar} titulo="Editar veículo">

      <div className="popup-editar__info">
        <img
          className="popup-editar__tipo-icon"
          src={veiculo.tipo === "M" ? Moto : Carro}
          alt={veiculo.tipo === "M" ? "Moto" : "Carro"}
        />
        <div>
          <p className="popup-editar__marca">{veiculo.marca}</p>
          <p className="popup-editar__modelo">
            {veiculo.modelo} · {veiculo.ano}
          </p>
        </div>
      </div>
      
      {isMoto ? (
        <p>
            Apenas a cor desse veículo pode ser editada. Para alterar outros
            dados, exclua e recadastre o veículo.
        </p>
      ) : (
        <p className="hint" style={{ marginBottom: "var(--space-4)" }} >
            Apenas cor e pedal auxiliar podem ser editados. Para alterar outros
            dados, exclua e recadastre o veículo.
        </p>
      )}

      <form onSubmit={handleSubmit(salvar)} noValidate>
        <div className="stack">
          <div className="field">
            <label className="label" htmlFor="editar-cor">
              Cor
            </label>
            <select
              id="editar-cor"
              className="input"
              {...register("cor", { validate: (value) => value !== "" })}
            >
              <option value="" disabled>
                Selecione a cor...
              </option>
              {(cores ?? []).map((cor) => (
                <option key={cor.id} value={cor.nome}>
                  {cor.nome}
                </option>
              ))}
            </select>
            {errors?.cor && <p className="error-message">Cor é obrigatória.</p>}
          </div>

          {!isMoto && (
            <div className="field">
              <span className="label">Pedal auxiliar</span>
              <label className="toggle">
                <input
                  type="checkbox"
                  id="editar-pedalAux"
                  className="toggle__input"
                  {...register("pedalAux")}
                />
                <span className="toggle__track">
                  <span className="toggle__thumb" />
                </span>
                <span className="toggle__label-texto">
                  Possui pedal auxiliar
                </span>
              </label>
            </div>
          )}

          <MsgErrosBackEnd arrayErrosBackend={arrayErrosBackend} />

          <div className="popup__rodape">
            <button
              className="btn btn--ghost btn--square"
              onClick={onFechar}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="btn btn--primary btn--square"
              type="submit"
              disabled={enviando}
            >
              {enviando ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </div>
      </form>
    </Popup>
  );
}
