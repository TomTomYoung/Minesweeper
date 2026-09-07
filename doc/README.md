# Minesweeper 引き継ぎ資料

調査日: 2026-09-07 UTC
調査対象: main
基準コミット: 30a29b7ab1fe4e0bb2cfa4fe4a2cafec8acabe08

このフォルダは、現行実装を基準に仕様、進捗、次担当者向けの作業指示をまとめたものです。既存の docs フォルダは過去の設計資料や個別解説として残し、本フォルダを作業再開時の入口とします。

## 読む順番

1. SPECIFICATION.md
2. PROGRESS.md
3. HANDOFF.md

## 文書の位置づけ

SPECIFICATION.md は、現行コードで確認できた挙動と、RPGモードで意図されている仕様を分けて記載します。

PROGRESS.md は、実装済み、部分実装、未実装、既知不具合を整理します。

HANDOFF.md は、次担当者が安全に作業を再開するための優先順位、確認手順、完了条件を示します。

## 情報源

1. src 以下の現行コード
2. index.html、normal.html、rpg.html、main.js
3. docs/現行の仕様書.md
4. docs/rpgモード仕様.md
5. docs/guitest_spec.md
6. docs/ズームとスクロールバー.md
7. main のコミット履歴およびマージ済み PR 1、PR 2

記述が食い違う場合、現在動くものの説明はコードを優先し、目標仕様は既存設計書を優先しています。
