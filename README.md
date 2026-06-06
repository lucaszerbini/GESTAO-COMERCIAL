# GESTAO-COMERCIAL

Sistema de gestão comercial completo desenvolvido em TypeScript com Node.js. Projeto acadêmico do 2º semestre de Análise e Desenvolvimento de Sistemas (ADS), cobrindo operações de clientes, produtos, pedidos, financeiro, funcionários e integrações com hardware.

---

## Sumário

- [Descrição](#descrição)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Módulos do Sistema](#módulos-do-sistema)
- [Funcionalidades](#funcionalidades)
- [Documentação da API](#documentação-da-api)
- [Testes](#testes)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Exemplos de Uso da API](#exemplos-de-uso-da-api)
- [Integrantes do Grupo](#integrantes-do-grupo)

---

## Descrição 

O **Sistema de Gestão Comercial** é uma API REST completa voltada para o gerenciamento de pequenos e médios comércios. Ele integra em um único sistema o controle de clientes, estoque de produtos, fluxo de pedidos, lançamentos financeiros, gestão de funcionários e comunicação com dispositivos de hardware (impressora térmica e balança eletrônica).

O sistema foi projetado com arquitetura modular (rotas → controllers → services → banco de dados), validação robusta de dados com Zod, suporte a transações no banco de dados SQLite, soft-delete em todos os cadastros e geração automática de entradas financeiras a partir de pedidos entregues.

---

## Tecnologias

| Camada | Tecnologia | 
