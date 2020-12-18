const axios = require('axios') // para realizar requisições

let url = 'https://eventsync.portaltecsinapse.com.br/public/recrutamento/input?email=ryan.carlos@ufms.br';

// retorna os pedidos
async function getPedidos(url) {
    const response = await axios.get(url)
    return response.data
}

// verifica se o dia do pedido pertence ao mes 12
function validaMes(obj) {
    if (obj.dia.substring(3, 5) == '12') {
        return true;
    } else {
        return false;
    }
}
// realiza a ordenação pela quantidade, ao final, o item mais vendido será o primeiro.
function ordenarPorQuantidade(item1, item2) {

    if (item1.quantidadeTotal < item2.quantidadeTotal) {
        return 1
    } else if (item1.quantidadeTotal > item2.quantidadeTotal) {
        return -1
    } else {
        return 0
    }
}
// ordena por ordem alfabética 2 strings
function ordenaPeloItem(item1, item2) {
    if (item1.item < item2.item) {
        return -1
    }
    return 1;
}

// verifica se há empate na quantidade total dos itens.
function verificaEmpate(maiorQuantidade, pedidosGroupBy) {
    empate = false

    for (pedido in pedidosGroupBy) {
        if (pedido == 0) continue;
        else {
            if (pedidosGroupBy[pedido].quantidadeTotal == maiorQuantidade) {
                empate = true;
            }
        }
    }
    return empate
}

// função principal, detalhes abaixo:
// função assincrona, pois faz requisições e lida com os dados retornados.
async function getItemMaisVendido(url) {

    let dados = await getPedidos(url) // retorna os pedidos
    let pedidosMes12 = dados.filter(validaMes) // filtra os pedidos pelo mes 12
    let allItens = [...new Set(pedidosMes12.map(pedido => pedido.item))] // todos os itens sem repetições.
    let pedidosGroupBy = [] // pedidos agrupados pelo item
    let itemMaisVendido

    // para cada item, realizar somatório da quantidade e do valor total
    allItens.forEach(item => {
        sumQuantidade = 0;
        sumValorTotal = 0;
        for (let pedido in pedidosMes12) {
            if (pedidosMes12[pedido].item == item) {
                sumQuantidade += pedidosMes12[pedido].quantidade
                sumValorTotal += pedidosMes12[pedido].total
            }
        }
        pedidosGroupBy.push({ 'item': item, 'quantidadeTotal': sumQuantidade, 'valorTotal': sumValorTotal.toFixed(2) })

    })

    //pedidos agrupados pelo item ordenado de forma decrescente pela quantidade.
    pedidosGroupBy.sort(ordenarPorQuantidade)

    //maior quantidade está na primeira posição, após ordenação.
    let maiorQuantidade = pedidosGroupBy[0].quantidadeTotal

    let empate = verificaEmpate(maiorQuantidade, pedidosGroupBy)
    let itensEmpate = []

    //caso houver empate, é atribuido a um array, todos os pedidos empatados.
    //caso contrário, o item mais vendido já é conhecido, este então é armazenado na var -> itemMaisVendido.
    if (empate === true) {
        pedidosGroupBy.forEach(pedido => {

            if (pedido.quantidadeTotal == maiorQuantidade) {
                itensEmpate.push(pedido)
            }
        })
    } else {
        itemMaisVendido = pedidosGroupBy[0]
    }

    //se a lista de empatados obtiver conter algo, essa lista é ordenada pelo nome do item, como sugerido.
    if (itensEmpate.length != 0) {
        itensEmpate.sort(ordenaPeloItem)
        itemMaisVendido = itensEmpate[0] //item mais vendido vai para a primeira posição da lista.
    }

    // texto formatado com o item mais vendido e o valor total.
    itemTextFormated = `${itemMaisVendido.item}#${itemMaisVendido.valorTotal}`

    // requisição post de acordo com as regras.
    let final = await axios.post('https://eventsync.portaltecsinapse.com.br/public/recrutamento/finalizar?email=ryan.carlos@ufms.br',
        itemTextFormated, {
            headers: { 'Content-Type': 'text/plain' }
        })
    return itemTextFormated
}
//chamada da função principal
getItemMaisVendido(url)