import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://aaswhpharfjprhwtkpyg.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || ''
)

const entries = [
  {
    category: 'API',
    title: 'Não há API disponível',
    content: `A Mooze oferece o modo comércio para uso de comerciantes no dia a dia com QR codes e pagamentos PIX com 20 minutos de validade cada código gerado.

Não possuímos API e nem oferecimento para QR Codes fixos para implementação em sistemas, comércios, sites ou app. Quando disponibilizarmos, iremos avisar nos nossos canais públicos eventuais termos e disponibilização.

Site: https://mooze.app
Telegram: https://t.me/+zkNS6KIDsEcyZDkx`,
    source: 'treinamento'
  },
  {
    category: 'Compatibilidade',
    title: 'Compatibilidade de aparelhos e migração de versão',
    content: `Se você era usuário do app da Mooze da primeira versão (antiga) e está tentando migrar para nova versão lançada em dezembro de 2025:
1. Salve sua frase de recuperação atual da carteira Mooze
2. Apague/delete o aplicativo antigo (NÃO DESINSTALE SEM A FRASE DE RECUPERAÇÃO)
3. Acesse https://mooze.app e baixe a versão mais atualizada
4. Use a opção "Importar carteira" e insira suas palavras de recuperação

Requisitos Android:
- Android 11 ou superior (Não compatível com Android GO)
- Aparelho 100% em 64 bits
- Não funciona em emuladores, ROMs customizadas, modo ROOT ou modo desenvolvedor ativado
- Modelos XIAOMI podem ter experiência não otimizada

Requisitos iPhone:
- iOS 17.6 ou superior
- Aparelho 100% em 64 bits (sem Jailbreak)
- Não compatível com iPad (versão 1.3.1)
- Não há compatibilidade com plataformas desktop MAC/iPhone

Se não atender os requisitos, o app pode não instalar ou ter o PIX restringido.

Usuários Android: acesse https://mooze.app para baixar versão mais recente.
Usuários iOS: utilize o link de instalação via TestFlight no site.

A Mooze não é compatível com saldos e endereços advindos de outros aplicativos como Aqua Wallet (usa modelos de endereços Wrapped Segwit ultrapassados).`,
    source: 'treinamento'
  },
  {
    category: 'App',
    title: 'Download direto do app',
    content: `Para download do app Mooze, acesse: https://beepurl.com/DfIqX

Usuários Android: baixe pelo site https://mooze.app
Usuários iOS: instale via TestFlight pelo link no site.`,
    source: 'treinamento'
  },
  {
    category: 'Bitcoin',
    title: 'Erro BASE58 - Endereço incompatível / envio para rede errada',
    content: `O erro ocorre ao tentar enviar Bitcoin/USDT para redes incompatíveis.

Endereços incompatíveis com Bitcoin Liquid (causam erro):
- Iniciados com "3" (Bitcoin onchain)
- Iniciados com "1" (Bitcoin onchain)
- Iniciados com "bc1p" (Bitcoin onchain Taproot)
- Iniciados com "bc1q" (Bitcoin onchain SegWit)
- Iniciados com "0x" (Ethereum)

Endereços compatíveis com Bitcoin Liquid e USDT Liquid:
- Iniciados com "VJ" (endereços Liquid)
- Iniciados com "lq" (LQ - endereços Liquid)

Para converter ativos e enviar para outras redes, use o botão "SWAP".
Tutorial de swap: https://youtu.be/fmyjppc3DQc?t=556
Tutorial USDT para outras redes: https://www.youtube.com/watch?v=XkO8OSKrlxw

Outras causas de erro:
- Conexão de internet instável
- Falha pontual no aplicativo (bug)
- Versão desatualizada do aplicativo Mooze`,
    source: 'treinamento'
  },
  {
    category: 'Bitcoin',
    title: 'Falha de envio BTC - Transação não confirmada',
    content: `Para envios Bitcoin onchain, verifique:
1. Está usando a taxa de rede mais rápida e alta?
2. O endereço de destino é compatível Bitcoin onchain?

Endereços Bitcoin onchain suportados para envio:
- Iniciados com "3"
- Iniciados com "1"
- Iniciados com "bc1p"
- Iniciados com "bc1q"

Endereços Liquid (USDT, DEPIX, Bitcoin Liquid):
- Iniciados com "VJ"
- Iniciados com "lq" (LQ)

Não é possível gastar saldos Bitcoin ainda não confirmados na rede.

Requisitos do app para funcionar corretamente:
Android: Android 11+, 64 bits, sem emuladores/ROOT/modo desenvolvedor
iPhone: iOS 17.6+, 64 bits, sem Jailbreak`,
    source: 'treinamento'
  },
  {
    category: 'Fiscal',
    title: 'Fiscal e reportes - DEPIX e declaração',
    content: `Sobre lei referente a stablecoins, o DEPIX não se classifica como algorítmica pois é lastreada em Bitcoin, reais e dólar.
Whitepaper DEPIX: https://github.com/eulen-repo/DePix/blob/main/whitepaper/depix_whitepaper-pt_BR.pdf

Para dúvidas sobre reporte e dados fiscais, acesse o "Manifesto contábil e fiscal" no app:
- Menu do app > "Central de dados" ou
- https://moozeapp.keepo.bio

O documento responde:
- Como funcionam e se há reporte das transações via DEPIX
- Como DEPIX poderia ser declarado em IRPF/IRPJ
- Como regularizar pagamentos DEPIX em notas fiscais PJ
- Quais regras de regulações os ativos comprados via DEPIX se aplicam`,
    source: 'treinamento'
  },
  {
    category: 'Lightning',
    title: 'Transações na rede Lightning',
    content: `Para Enviar Pagamentos Lightning:

Tipos de Invoices SUPORTADOS:
- Invoices LNURL com valores pré-definidos pelo emissor
- Tags no padrão "fulano@fulano.com" (com "@" e palavras comuns)

Tipos NÃO SUPORTADOS:
- Invoices sem valor definido (ex: lnbc1c1n2....c128ue12u0)
- Tags com símbolos especiais como "!, #, $, ₿"

Para Recebimento via Lightning:
- Selecione a rede "Lightning" no aplicativo
- Defina o valor desejado em SATS ou moeda fiduciária
- Isso gera um invoice LNURL com valor pré-determinado

Todos os envios/recebimentos Lightning são em autocustódia do usuário.
Os pagamentos usam saldo em Bitcoin Liquid mantido sob posse exclusiva.
Valores recebidos são convertidos automaticamente em Bitcoin Liquid na autocustódia.

Playlist de tutoriais: https://youtube.com/playlist?list=PLG1GQN_syJ4y92S5B4gX0Xh-npM-7k0dj`,
    source: 'treinamento'
  },
  {
    category: 'PIX',
    title: 'PIX - Limite R$5000 e estorno',
    content: `A contestação PIX pode ocorrer por estorno após análise bancária nos seguintes casos:
- Pagamento recusado no sistema de análise de pagamentos das parceiras
- Titularidade de conta ultrapassou o limite de R$5000 por CPF/CNPJ ao dia no DEPIX
- Transações consecutivas em curto período (comportamento de automação)
- Titular da conta pagante com restrição no sistema de pagamentos PIX/DEPIX

O valor é estornado à conta originária quando sinalizado pelo sistema de segurança.`,
    source: 'treinamento'
  },
  {
    category: 'PIX',
    title: 'Limites de transação - Explicação do sistema de score',
    content: `A Mooze utiliza um sistema interno de pontuação (score) baseado no comportamento e reputação nas transações.

Limites progressivos:
- Início: R$50,00 por operação
- Com uso legítimo: avança para R$250
- Score elevado: até R$3.000

Regras importantes:
- Não realizamos alterações no score por solicitação individual
- Períodos de inatividade prolongados podem causar regressão gradual do score
- Desinstalar o app ou importar carteira para novo dispositivo reinicia o score para R$50

ATENÇÃO: Usuários que ativem reiteradamente os sistemas antifraude, usem automação/bots ou promovam disputas bancárias indevidas (MED) serão banidos permanentemente do PIX.

Para acesso a limites superiores: uso contínuo e legítimo ao longo de várias semanas.`,
    source: 'treinamento'
  },
  {
    category: 'PIX',
    title: 'PIX - Ativo entregue mas usuário insiste que não recebeu',
    content: `Se o ativo foi entregue e comprovado, mas o usuário não vê os saldos:

1. Conexão de rede instável:
- Reinicie o app e a conexão (ligue/desligue modo avião)
- Feche completamente o app
- Reinicie a conexão Wi-Fi ou 4G
- Desative VPN ou rede TOR se estiver usando

2. Troca de carteira antes do ativo ser depositado:
Se o usuário desinstalou/resetou o app após pagar o PIX mas antes de receber:
- Os ativos foram enviados para a carteira original
- Com a frase semente (12/24 palavras), os fundos podem ser acessados em outra wallet
- Alternativa: usar Blockstream App (https://blockstream.com/app) com as mesmas 12/24 palavras

3. Bug ou problema não identificado:
- Os ativos sempre são entregues via automação para os endereços da frase de recuperação
- Mesmo com BUG, é possível acessar os fundos com a frase de recuperação em outro app compatível`,
    source: 'treinamento'
  },
  {
    category: 'PIX',
    title: 'Estornos PIX - Política de reversão',
    content: `A contestação de PIX pode resultar em estorno por:
- Pagamento recusado no sistema de análise de pagamentos das parceiras
- Titularidade ultrapassou o limite de R$5000 por CPF/CNPJ ao dia no DEPIX
- Transações consecutivas num curto período (sistema bancário identifica automação)
- Titular da conta pagante com restrição no sistema de pagamentos PIX/DEPIX

Quando ocorre estorno, o valor é devolvido à conta originária.`,
    source: 'treinamento'
  },
  {
    category: 'PIX',
    title: 'PIX - HOLD antifraude - Pagamento em análise',
    content: `O pagamento foi sinalizado para análise de segurança conjunta pelas parceiras financeiras e bancárias.

- Se aprovado: valor creditado em até 3 dias (nunca excede 7 dias)
- Se não aprovado: valor estornado ao pagador original

100% dos pagamentos passam por análise de risco das processadoras.
- Transações normais: concluídas em até 5 minutos
- Transações com sinal de risco: processo pode levar até 7 dias

A Mooze prioriza privacidade do usuário e segurança das operações.

Acompanhe o andamento em "Histórico de transações" no menu do app.`,
    source: 'treinamento'
  },
  {
    category: 'PIX',
    title: 'PIX não caiu - Solicitar dados para análise',
    content: `Para analisar o caso de pagamento PIX não entregue, solicite os seguintes dados ao usuário:

1. Comprovante de pagamento PIX completo e compartilhado do app de pagamentos contendo todos os dados claros do pagador (prints cortados ou rasurados não servem)

2. ID de suporte do aplicativo Mooze:
- Acesse o menu "Configurações" no app
- Selecione "Contatar Suporte" e copie o código exibido

3. ID do depósito:
- Acesse menu do app > "Histórico de transações"
- Toque na transação > copie o "ID do depósito"

Inclua também: valor pago, data e horário.

100% das transações passam por análise bancária. Transações em análise podem levar até 3 dias (máximo 7 dias). Acompanhe em "Histórico de transações".`,
    source: 'treinamento'
  },
  {
    category: 'PIX',
    title: 'PIX não funciona - Instabilidade ou bloqueio',
    content: `A situação pode estar relacionada a instabilidade de conexão, uso incorreto ou conta barrada pela processadora.

Causas possíveis:
- Conexão de internet instável
- Perda de conexão com a processadora bancária parceira
- Falha pontual no app ou na processadora
- Versão desatualizada do app
- Uso em emuladores ou aparelhos com sistema alterado (bloqueados)

Soluções:
1. Verifique e atualize o app para versão mais recente
   - Android: https://mooze.app
   - iOS: atualizar via TestFlight
2. Reinicie o app e a conexão de internet
3. Para gerar QR Code PIX: o botão é acionado deslizando da ESQUERDA para DIREITA (não pressionando)

Bloqueios: usuários com estornos indevidos via MED, mau uso ou fraude podem ser bloqueados permanentemente (Item 7 dos Termos de Uso).

Para verificar bloqueio: envie seu ID de suporte (menu > Configurações > Contatar Suporte).
Canal oficial: https://t.me/+zkNS6KIDsEcyZDkx`,
    source: 'treinamento'
  },
  {
    category: 'PIX',
    title: 'PIX pago - Atrasado / revisão de pagamento',
    content: `Algumas transações podem levar mais tempo que o habitual para processar, pois 100% dos pagamentos são analisados por parceiros financeiros de análise de risco.

Prazos:
- Transações normais (não sinalizadas): 5 a 25 minutos
- Transações sinalizadas: liberação em até 7 dias (média de 3 dias)

No app versão 1.3.1+: acesse "Histórico de transações" > aba "PIX" para acompanhar o processamento desde a criação até a entrega dos ativos.

Se a demanda foi processada com sucesso, disponibilizar o comprovante de entrega de ativos ao usuário para conferência.`,
    source: 'treinamento'
  },
  {
    category: 'Referrals',
    title: 'Programa de referrals / indicação',
    content: `A Mooze não fornece códigos de indicação de parceiros existentes. Esses códigos são compartilhados pelos próprios parceiros em suas redes.

Requisitos mínimos para se tornar parceiro:
- Pelo menos 10 mil inscritos em uma única rede social
- Atividade recorrente nos últimos 30 dias
- Redes sociais sem apologia a políticos/partidos políticos

Benefícios:
- Usuários indicados por referral: 15% de desconto vitalício em todas as taxas
- Parceiro de referral: recebe 15% do lucro bruto da Mooze sobre tudo que os indicados pagarem, diretamente em autocustódia

Para análise de parceria: envie links de suas redes sociais ativas em resposta ao e-mail.`,
    source: 'treinamento'
  },
  {
    category: 'App',
    title: 'Saldo indisponível - Bug visual',
    content: `O status "indisponível" é apenas um bug de tela, não afeta a capacidade de usar, receber ou transmitir ativos.

Ocorre quando alguma inconsistência de conexão de rede acontece no aparelho após swap ou recebimento recente de Bitcoin L2. O app não consegue mostrar corretamente o valor em moeda FIAT do ativo.

É uma inconsistência de sincronização de dados em tela em relação à cotação em moeda FIAT. Os fundos estão OK e prontos para uso. A correção será lançada em nova versão.`,
    source: 'treinamento'
  },
  {
    category: 'Seeds',
    title: 'Seeds - Importação e compatibilidade',
    content: `A Mooze Wallet utiliza exclusivamente endereços NATIVE SEGWIT (BIP39, caminho m/84'/0'/0') tanto na rede Bitcoin Onchain quanto na Liquid Network.

Carteiras COMPATÍVEIS para importação:
- Bluewallet (Bitcoin only)
- Electrum (Bitcoin only com BIP39, não o criado direto no app Electrum)
- Greenwallet / Blockstream Wallet (Liquid e Bitcoin)
- Sideswap criadas a partir de Julho de 2025

NÃO compatível com:
- Aqua Wallet (usa Wrapped Segwit)
- Seeds não BIP39
- Derivação diferente de m/84'/0'/0'

Para verificar qual derivação sua carteira usa: https://walletsrecovery.org

Formato aceito de inserção:
✅ Correto: "wheat guitar shift man" (com espaços)
❌ Errado: "wheat, guitar, shift, man" (com vírgulas)

Se a carteira for AQUA ou SIDESWAP antiga: importe seeds normalmente, depois envie os fundos manualmente para sua nova carteira Mooze.
Tutorial: https://youtu.be/wAABcBdWTSw?si=d2hUKNDyvB2gq922`,
    source: 'treinamento'
  },
  {
    category: 'SWAP',
    title: 'SWAP demorando - BUG DEPIX',
    content: `Os swaps de moedas em autocustódia são executados pela API pública da parceira SIDESWAP.

Prazos de swap:
- Trocas sem Bitcoin onchain: imediato
- PEG-IN/OUT (Bitcoin ↔ LBTC): 20 minutos a +17 horas (dependendo da liquidez SIDESWAP)

Não são possíveis trocas entre outros ativos além dos listados.
FAQ da SIDESWAP sobre liquidez: https://sideswap.io/faq/peg-in-out

BUG conhecido: troca de DEPIX por Bitcoin Onchain é inválida em aparelhos incompatíveis com versões antigas do app.

Sempre atualize o app:
- Android: https://mooze.app (botão do Android)
- iOS: TestFlight (mantenha atualizações automáticas ativadas)

Se o swap levar mais de 17 horas: contate o suporte da SIDESWAP com o ID de swap em mãos.
Suporte Sideswap: https://sideswap.io/support`,
    source: 'treinamento'
  },
  {
    category: 'SWAP',
    title: 'SWAP instável - Problemas gerais de swap',
    content: `Causas de falha no SWAP:
- Conexão de internet instável, uso de VPN exótica ou rede TOR
- Perda temporária de conexão com sistemas parceiros (app inativo por muito tempo)
- Falha pontual no app ou na tecnologia parceira de swaps
- Versão desatualizada do app

Soluções:
1. Verifique se está na versão mais atual (1.3.1 - ver no rodapé do menu)
   - Android: https://mooze.app
   - iOS: TestFlight (manter atualizações automáticas ativas)
2. Reinicie o app e a conexão de internet

Versão app antigo (1.2) - swaps via SIDESWAP:
- Swaps com mais de 17 horas: acione suporte da SIDESWAP

Versão atual (1.3+):
- Swaps de Bitcoin: operados pela Breez
- Swaps liquid (DEPIX e USDT): continuam com SIDESWAP
- Swaps liquid falham → estorno automático via SIDESWAP
- Swaps Bitcoin falham → entre em contato: contact@breez.technology
  (inclua a hash da transação Bitcoin Liquid ou onchain que saiu da wallet)`,
    source: 'treinamento'
  },
  {
    category: 'PIX',
    title: 'Como fazer PIX - Código inválido',
    content: `O erro de código inválido no pagamento PIX ocorre geralmente por 2 motivos:

1. Usar QR CODE ou código de endereço cripto (DEPIX, USDT, Bitcoin) em vez do código gerado na tela de PIX (círculo rosa com símbolo do PIX)

2. Tentar pagar um QR CODE ou código PIX que já expirou (tempo de vida médio de ~20 minutos)

Para uso correto: use sempre o código gerado na tela PIX do app.
Tutorial: https://youtu.be/xTRb_zvMT2o?si=47lZ_oXN7AW9PqA6`,
    source: 'treinamento'
  },
  {
    category: 'PIX',
    title: 'Estornos e antifraude - Política completa',
    content: `Todos os PIX na Mooze passam por rigoroso sistema de análise de risco em parceria com instituições de pagamento autorizadas.

Quando o risco é elevado, o pagamento pode ser devolvido automaticamente ao pagador para proteção do sistema.

Fatores que geram análise extra ou devolução:
- Uso frequente ou inadequado do Mecanismo Especial de Devolução do PIX (MED) pelos pagantes
- Comportamento dos pagadores similar a robôs
- Acionamento de MED em transações já em análise

Padrões incomuns podem resultar em: maior escrutínio, atrasos, estornos, ou bloqueio irreversível do PIX.

Para comerciantes: ofereça serviços legítimos e evite contestações injustificadas via MED.
Prazos: 5-25 minutos (normal), até 7 dias (com análise bancária)

Para contestar uma transação, envie:
- ID do depósito (Histórico de transações > transação > ID do depósito)
- ID de suporte do app (Configurações > Contatar Suporte)
- Valor, data e horário da transação`,
    source: 'treinamento'
  },
  {
    category: 'PIX',
    title: 'PIX atrasado pós-sinistro - Pagamento processado',
    content: `Em casos de ocorrência nos processamentos durante determinado período, a Mooze anuncia nos canais oficiais:
- Canal Telegram (acessível via menu do app > Suporte)
- Bot de suporte e FAQ

Para pagamentos contestados que já foram processados: disponibilizar comprovantes de entrega dos ativos para conferência.`,
    source: 'treinamento'
  },
  {
    category: 'Bitcoin',
    title: 'Saque Bitcoin - Converter cripto para FIAT',
    content: `Para retorno de ativos cripto para moeda bancária FIAT, utilize as parceiras da Mooze:

Parceira atual: PagBitcoin
- Para sacar reais via PIX ou depósitos
- Para pagar boletos do dia a dia
- Acesse via menu do app > "Saque DEPIX" ou "Serviços Bitcoin"

Para usar o serviço:
- Envie Bitcoin onchain ou via Lightning usando seus saldos Bitcoin L2 da carteira Mooze`,
    source: 'treinamento'
  },
  {
    category: 'App',
    title: 'App não sincroniza',
    content: `Causas do app não sincronizar:
1. Compatibilidade do aparelho (ver requisitos abaixo)
2. Versão desatualizada do app
3. Conexão instável
4. Processadora bancária parceira instável
5. Mau uso (bloqueio PIX)

Requisitos Android: Android 11+, 64 bits, sem emuladores/ROOT/modo desenvolvedor, sem ROM customizada
Requisitos iPhone: iOS 17.6+, 64 bits, sem Jailbreak

Soluções:
1. Atualizar app para versão 1.3.1 (verificar no rodapé do menu)
   - Android: https://mooze.app
   - iOS: TestFlight
2. Reiniciar app e conexão (fechar, reiniciar Wi-Fi/4G, reabrir)

Casos de bloqueio (Item 7 dos Termos de Uso): estornos indevidos ou correlações com pagamentos fraudulentos podem resultar em bloqueio irreversível do PIX.
Canal de notificações: https://t.me/+zkNS6KIDsEcyZDkx`,
    source: 'treinamento'
  },
  {
    category: 'SWAP',
    title: 'SWAP - Saldos não confirmados (erro ao mover fundos)',
    content: `Para conseguir mover saldos e realizar swaps, não pode haver transações pendentes de confirmação na rede blockchain.

Saldos somente podem ser gastos quando não há quantias a confirmar. Se houver ativos com status "pendente" no histórico, não podem ser gastos ainda.

Para verificar status de transações:
- Menu do app > "Histórico de transações"
- Toque na transação > "Ver no explorer"

Bitcoin onchain: leva ao menos 10 minutos para confirmação. Com taxas baixas, pode levar horas ou dias.

Solução: Se quiser mover fundos com parte do saldo pendente, não use o botão "MAX". Use apenas o valor equivalente ao confirmado, ou aguarde todos os saldos serem confirmados.`,
    source: 'treinamento'
  },
  {
    category: 'Taxas',
    title: 'Taxas de rede baixas - BTC sumiu / Transação não aparece',
    content: `Quando se envia Bitcoin com taxa de rede LENTA (mínima):
- A transação sai da carteira mas pode demorar horas ou dias para aparecer na Mempool
- Nem todos os mineradores aceitam processar transações com taxa muito baixa
- A transação fica na fila até um nó de mineração aceitar processá-la

Solução: aguardar confirmação (não é possível cancelar).

Para novas transações: sempre use a taxa de rede mais alta se não quiser esperar.

Para swaps via SIDESWAP: pode levar de 20 minutos a 17 horas para processar.
Se passou mais de 17 horas: contate o suporte da SIDESWAP com o ID de swap.

Referência: https://x.com/moozelabs/status/1989712526238474583`,
    source: 'treinamento'
  },
  {
    category: 'Taxas',
    title: 'Taxas de rede para envios de USDT/DEPIX',
    content: `Na rede Liquid (onde USDT Liquid e DEPIX funcionam), TODAS as transações precisam pagar uma taxa pequena para os validadores/mineradores da rede.

Essa taxa é paga em Bitcoin Liquid (BTC L2) - é o "combustível" da rede.
Valor: entre 40 e 300 sats normalmente.

OBRIGATÓRIO: ter pelo menos ~100 sats em Bitcoin Liquid para enviar USDT ou DEPIX.

Se sua carteira de BTC L2 estiver zerada:
1. Vá na seção SWAP dentro do app
2. Troque um pouco do seu USDT/DEPIX por BTC L2 (Bitcoin Liquid)
3. Com ~100 sats ou mais, tente enviar novamente

Tutorial sobre taxas de rede: https://youtu.be/uNIrx9LwED0?list=PLG1GQN_syJ4y92S5B4gX0Xh-npM-7k0dj&t=1060`,
    source: 'treinamento'
  },
  {
    category: 'Taxas',
    title: 'Taxas do app - Estrutura de taxas PIX',
    content: `Estrutura de taxas nas transações via PIX:

Custo fixo: R$2 dos parceiros + taxas de rede variáveis + taxa P2P:
- R$20 a R$55 → R$1 (Fixo) taxa P2P
- R$55 a R$499 → 3,50% taxa P2P
- Acima de R$500 → 3% taxa P2P (+ 15% de desconto)

Com código de indicação de parceiro (~15% desconto adicional):
- R$20 a R$55 → R$1 (Fixo)
- R$55 a R$499 → 3,25%
- Acima de R$500 → 2,75%

Taxas de rede:
- Pagas aos mineradores das redes Bitcoin e Liquid Network (não são da Mooze)
- Rede Liquid: R$0,40 a pouco mais de R$2,00

Cotação Bitcoin:
- Flutuante (não fixa) - usa média de 5 fontes: Coingecko, Gate.Io, Binance, Blockchain.com, Google USA
- Spread de segurança de 0,5% a 3% para volatilidade durante análise bancária
- A cotação é flutuante: quanto mais demorar o processamento, maior a variação`,
    source: 'treinamento'
  },
  {
    category: 'SWAP',
    title: 'USDT - Enviar via SWAP / converter para outras redes',
    content: `O USDT da carteira Mooze é da rede Liquid Network. Não é possível enviar diretamente para endereços de outras redes (Ethereum, Solana, etc.).

Para enviar USDT para cartões cripto (KAST), corretoras ou endereços Ethereum:
Tutorial: https://youtu.be/3vYevQjJtpU?si=EkQbOAaRxcI1oCxE

Plataformas para trocar USDT Liquid por outras moedas:
- https://sideshift.ai
- https://changelly.com

ATENÇÃO: Para enviar USDT Liquid, você precisa ter saldo mínimo de Bitcoin Liquid para pagar taxas de rede.
Mantenha ao menos 0.00000500 BTC Liquid (500 sats) para envios de USDT.

Se sem saldo de taxas: faça SWAP de uma pequena quantia de USDT para BTC Liquid primeiro.
Tutorial taxas de rede: https://youtu.be/Xgi4Z5y8S7Y?si=KL2Kv505ukjuom8t`,
    source: 'treinamento'
  },
  {
    category: 'Usuário Banido',
    title: 'Usuário banido - Infração dos termos de uso',
    content: `Identificamos através do ID de suporte a condição de não funcionamento dos serviços PIX:

Infração do Item 7 dos Termos de Uso da Mooze.

Consequências:
- Desativação permanente e irreversível do uso dos serviços PIX na Mooze
- Vinculação de todos os titulares PIX pagos via o APP em lista negra
- Banimento dos serviços de saques DEPIX e uso dos serviços DEPIX globalmente em qualquer serviço que utilize DEPIX

Motivo detectado pela parceira bancária:
- Múltiplas tentativas de pedido de estorno PIX de pagamentos gerados pelo app vinculados a 1 ou mais titularidades pagadoras.

Este processo é definitivo, irreversível e encerra as prestações de serviço do PIX via Mooze com este ID de usuário.`,
    source: 'treinamento'
  },
  {
    category: 'Usuário Banido',
    title: 'Prova de legitimidade para desbloqueio de conta',
    content: `Para liberar ou avaliar liberação de usuário legítimo para continuar com pagamentos:

Prova via YouTube:
1. Acesse YouTube Studio > Configurações > aba "Permissões"
2. Tire print mostrando seu Gmail como proprietário
3. Poste um vídeo/short "Não listado" com título: XFG1872-Mooze-1FA
4. Envie o link compartilhável do vídeo com o Gmail proprietário

Prova via e-commerce (Hotmart, Mercado Livre, similares):
1. Publique um produto de teste com código: XFG1872-Mooze-1FA como nome
2. Conta de vendas com mais de 3 meses de existência
3. Notas de clientes, quantidade de produtos vendidos

Nota: O código de verificação acima é de exemplo. Use o código fornecido no atendimento específico.`,
    source: 'treinamento'
  },
  {
    category: 'SWAP',
    title: 'SWAP Bitcoin pendente - TX not found / Swap não finaliza',
    content: `Swaps de Bitcoin onchain para Bitcoin Liquid (BTC L2) requerem que o Bitcoin onchain esteja confirmado na rede Bitcoin primeiro.

Com taxa LENTA/ECONÔMICA: a transação pode ficar na fila por dias ou semanas até ser confirmada.
- Enquanto pendente: novos swaps de Bitcoin onchain são bloqueados até o swap em aberto finalizar
- "Transaction not found" no explorer: significa que o Bitcoin Liquid existe mas aguarda confirmação do Bitcoin onchain

Isso não é BUG - é o funcionamento normal da blockchain Bitcoin com taxas baixas.

Soluções:
- Aguardar confirmação
- Se aparecer status "Reembolsável": selecionar para reaver os ativos em Bitcoin onchain

Para não ocorrer: use sempre a taxa mais alta de rede em swaps (não a taxa econômica).

Para verificar transações pendentes: menu > "Histórico de transações" (usando filtros de pesquisa).

A Mooze irá eliminar as taxas baixas de swap em próxima versão para evitar este problema.`,
    source: 'treinamento'
  }
]

async function importKnowledge() {
  console.log(`Importing ${entries.length} entries to knowledge_base...`)

  // Clear existing entries from treinamento
  const { error: deleteError } = await supabase
    .from('knowledge_base')
    .delete()
    .eq('source', 'treinamento')

  if (deleteError) {
    console.warn('Warning clearing old entries:', deleteError.message)
  }

  let success = 0
  let failed = 0

  for (const entry of entries) {
    const { error } = await supabase
      .from('knowledge_base')
      .insert(entry)

    if (error) {
      console.error(`Failed: ${entry.title}:`, error.message)
      failed++
    } else {
      console.log(`✓ ${entry.category}: ${entry.title}`)
      success++
    }
  }

  console.log(`\nDone: ${success} imported, ${failed} failed`)
}

importKnowledge().catch(console.error)
