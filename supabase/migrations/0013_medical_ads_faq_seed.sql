-- Perguntas e respostas de referência sobre publicidade médica (baseado nos
-- princípios gerais da Resolução CFM nº 2.336/2023). É um ponto de partida —
-- a agência pode editar, adicionar ou remover itens depois pela tela de FAQ.

insert into public.medical_ads_faq (question, answer, position) values
(
  'Posso usar fotos de antes e depois?',
  'Sim, mas com regras: só do próprio paciente, com autorização por escrito, sem garantir resultado e sem uso para "vender" o procedimento (preço, promoção, comparação). O foco deve ser educativo, nunca promocional.',
  1
),
(
  'Posso divulgar preços e promoções de procedimentos?',
  'Não. É vedado anunciar preços, formas de pagamento, descontos, brindes ou qualquer tipo de promoção de consultas e procedimentos médicos nas redes sociais.',
  2
),
(
  'Posso dizer que sou "o melhor" ou "o mais indicado" na minha especialidade?',
  'Não. Termos de autopromoção, comparação com colegas ou superlativos ("o melhor", "referência nacional", "mais eficaz") não são permitidos. A comunicação deve ser técnica e sóbria.',
  3
),
(
  'Preciso colocar meu CRM nas publicações?',
  'Sim. Nome completo e número de registro no CRM (com o estado) devem aparecer de forma visível no perfil e, sempre que possível, nas peças que mencionam o médico.',
  4
),
(
  'Posso usar depoimentos de pacientes como propaganda?',
  'Não. Depoimentos de pacientes (vídeo, texto ou print de mensagem) usados para promover o profissional ou o procedimento são proibidos, mesmo com autorização do paciente.',
  5
),
(
  'Posso fazer live ou vídeo realizando um procedimento?',
  'Não é permitido divulgar imagens, vídeos ou transmissões ao vivo de cirurgias ou procedimentos, mesmo com fins educativos, em canais abertos ao público em geral.',
  6
),
(
  'Que tipo de conteúdo é seguro postar?',
  'Conteúdo educativo: explicar o que é uma condição ou especialidade, desmistificar dúvidas comuns, orientar sobre prevenção e cuidados gerais, bastidores do consultório/clínica sem expor pacientes ou procedimentos.',
  7
),
(
  'Posso usar termos como "indolor", "sem cicatriz" ou "resultado garantido"?',
  'Não. É proibido prometer resultados ou garantir ausência de dor, risco ou cicatriz — toda intervenção médica tem riscos, e a comunicação não pode sugerir o contrário.',
  8
);
