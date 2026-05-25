# ADR-006: Padrão de UI/UX e Validação de Datas

**Status:** Aceito  
**Data:** 2026-05-25  
**Contexto:** Correção de bugs de inputs de data e validações de endpoint de adição no Dashboard e Invite Form.

---

## Problema

1. **UX de Data em Mobile (iOS):** O Safari móvel no iOS não renderiza o atributo `placeholder` em elementos `input[type="date"]` nativos. Para contornar isso, implementações anteriores alteravam dinamicamente o tipo de input (`type="text"` no desfoco, `type="date"` no foco). No entanto, essa troca dinâmica quebra a validação nativa do navegador, permitindo o envio de valores arbitrários e mal formatados.
2. **Inconsistência de Dados no Backend:** O Mongoose esperava objetos do tipo `Date` no Schema, mas strings mal formatadas enviadas pelo formulário podiam corromper ou falhar silenciosamente no MongoDB sem uma barreira de validação explícita no endpoint.

## Decisão

Adotar um padrão único de exibição visual (sem JS dinâmico) e um padrão duplo de validação de data (frontend e backend):

### 1. Padrão de UI/UX para Inputs de Data (Solução iOS/Safari)
Sempre usar `<input type="date">` nativo e envolver o campo em um container relativo contendo um elemento irmão `<span class="date-placeholder">` para atuar como o placeholder visual:

```html
<div class="inline-date-wrapper">
    <input type="date" id="new-birthdate" name="birthdate" required class="inline-input-date" max="9999-12-31">
    <span class="date-placeholder">Data (dd/mm/aaaa)</span>
</div>
```

E no arquivo CSS correspondente, aplicar as seguintes regras:
- Posicionamento absoluto do placeholder centralizado sobre o input.
- Ocultar o placeholder quando o input receber foco (`:focus`) ou contiver valor válido (`:valid`).
- Tornar o texto vazio do input invisível quando não focado e inválido (`:not(:focus):invalid { color: transparent; }`) para evitar que a máscara padrão do navegador sobreponha o placeholder.

```css
.inline-date-wrapper {
    position: relative;
    width: 100%;
}
.date-placeholder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    transition: opacity 0.2s;
}
.inline-input-date:focus ~ .date-placeholder,
.inline-input-date:valid ~ .date-placeholder {
    opacity: 0;
}
.inline-input-date:not(:focus):invalid {
    color: transparent;
}
```

### 2. Padrão de Validação de Datas (Frontend e Backend)
Tanto no cliente (JS de submissão do formulário) quanto no servidor (Controller), as datas enviadas em formato string devem respeitar estritamente duas checagens:
1. **Validação de Formato:** A string deve corresponder exatamente ao formato ISO `YYYY-MM-DD` usando a expressão regular:
   ```ts
   /^\d{4}-\d{2}-\d{2}$/
   ```
2. **Validação Lógica:** O valor da data deve ser um valor de calendário válido (evitando dias como 30 de fevereiro), checado via:
   ```ts
   isNaN(new Date(birthdate).getTime())
   ```

No backend, após validada com sucesso, a data deve ser salva explicitamente como um objeto `Date` no banco de dados.

---

## Alternativas Consideradas

| Alternativa | Por que descartada |
|---|---|
| Troca dinâmica de `type="text"` para `type="date"` | Quebra validações nativas HTML5 e permite submissão de valores inválidos (ex: DD/MM/AAAA por digitação). |
| Libs externas de Date Picker (ex: flatpickr) | Adiciona dependência desnecessária ao projeto e peso ao bundle final; a solução nativa + CSS é mais leve e atende aos requisitos. |
| Apenas validação no frontend | Ataques maliciosos ou bypass de requisições poderiam enviar strings de data mal formatadas, corrompendo a consistência do MongoDB. |

## Consequências

- ✅ UX consistente em dispositivos móveis (iOS/Safari) sem recorrer a scripts JS intrusivos ou instáveis.
- ✅ Segurança e consistência de dados garantidas, impedindo registros corrompidos no banco.
- ⚠️ Sempre que um novo formulário com input de data for adicionado, deve-se seguir o padrão de HTML/CSS de wrapper.
