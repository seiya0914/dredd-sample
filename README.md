# FastAPI + Dredd テストサンプル

このプロジェクトは、[FastAPI](https://fastapi.tiangolo.com/) バックエンドに対して [Dredd](https://dredd.org/en/latest/) を用いた API テストを実行するサンプルです。

## プロジェクトの状態

現在、このプロジェクトは `GET /items` エンドポイントのみに焦点を当てた最小限の状態です。基本的な Dredd テストが正常にパスすることを確認するため、OpenAPI 仕様 (`openapi.yaml`) と FastAPI 実装 (`main.py`) が簡略化されています。

この状態に至るまで、以下のステップを踏みました：

1.  複数のエンドポイント（items, users, status など）や認証機能を含む、より複雑な API 定義から開始しました。
2.  仕様、実装、テストの期待値（特にステータスコードやリクエスト/レスポンス例）間の不一致により、様々な Dredd テスト失敗に直面しました。
3.  認証機能や不要なエンドポイント（`/users`, `/status`, `/config`, `/debug/reset`）を削除しました。
4.  `/items` エンドポイント（POST, PUT, DELETE）とその例を `openapi.yaml` で、対応するロジックを `main.py` で洗練させました。
5.  特定のテストケース（例：400 や 404 エラーを強制する）のために、Dredd フック (`hooks.js`) を使用してリクエストを動的に変更しました。
6.  安定したベースラインを確立するため、プロジェクトを大幅に簡略化し、`GET /items` のみを含めるようにしました。これにより、警告なしで Dredd がクリーンにパスするようになりました。

今後のステップとして、他のエンドポイント（`/items` の POST, PUT, DELETE など）を一つずつ再導入し、各段階でテストがパスすることを確認していきます。

## セットアップ

### 前提条件

*   Python 3.8 以降 (FastAPI サーバー用)
*   Node.js および npm (Dredd および依存パッケージ用)

### インストール

1.  **リポジトリをクローン:**
    ```bash
    git clone https://github.com/seiya0914/dredd-sample.git
    cd dredd-sample
    ```

2.  **Python 仮想環境のセットアップ (任意ですが推奨):**
    ```bash
    python -m venv venv
    source venv/bin/activate  # Windows の場合は `venv\Scripts\activate` を使用
    ```

3.  **Python 依存関係のインストール:**
    ```bash
    pip install fastapi uvicorn
    ```
    *(注意: 依存関係管理を容易にするために `requirements.txt` ファイルを追加することも可能です)*

4.  **Node.js 依存関係のインストール:**
    ```bash
    npm install
    ```

## アプリケーションの実行

1.  **FastAPI サーバーの起動:**
    ```bash
    python main.py
    ```
    サーバーは `http://localhost:3000` で実行されます。

## Dredd テストの実行

1.  **FastAPI サーバーが実行中であることを確認してください。**
2.  **Dredd テストの実行:**
    ```bash
    npm test
    ```
    このコマンドは、`package.json` で定義された実行中のサーバーに対して `openapi.yaml` 仕様を用いて Dredd を実行します。

## プロジェクトファイル

*   `main.py`: API エンドポイントを実装する FastAPI アプリケーション。
*   `openapi.yaml`: API を記述する OpenAPI 3.0 仕様。
*   `package.json`: 依存関係 (Dredd など) とテストスクリプトを定義する Node.js プロジェクトファイル。
*   `hooks.js`: テスト中にリクエスト/レスポンスを変更するために使用される Dredd フックファイル（現在はコメントアウトされています）。
*   `dredd-report.html`: (削除済み) Dredd によって生成された HTML レポートの例（レポートオプションは現在 `package.json` で無効化されています）。
