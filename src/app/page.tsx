"use client";

import { useState } from "react";

export default function Home() {
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!txHash) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: txHash }),
      });
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        const tx = data.tx;
        const receipt = data.receipt;
        const gas = data.gas;
        
        let diagnosis = "";
        let statusColor = "green";
        let currentGas = 0;
        let networkGas = 0;

        // Check if transaction was mined (blockNumber exists and is not 0x0)
        const isMined = tx && tx.blockNumber && tx.blockNumber !== "0x0";

        if (isMined) {
          // Transaction is in a block. Now check if it succeeded or failed.
          if (receipt && receipt.status === "0x1") {
            diagnosis = "✅ Your transaction is confirmed and executed successfully.";
            statusColor = "green";
          } else if (receipt && receipt.status === "0x0") {
            diagnosis = "❌ Your transaction was mined, but it FAILED during execution. You lost the gas fee. You need to try again with different parameters.";
            statusColor = "red";
          } else {
            diagnosis = "⏳ Transaction is mined, but receipt status is unknown. Please check Etherscan.";
            statusColor = "yellow";
          }
        } else if (tx) {
          // Transaction exists but has no block, meaning it's pending in the mempool
          statusColor = "red";
          const hexGasPrice = tx.gasPrice || "0x0";
          currentGas = parseInt(hexGasPrice, 16) / 1e9;
          networkGas = parseFloat(gas.ProposeGasPrice) || 0;

          if (currentGas < networkGas) {
            diagnosis = `⚠️ Your transaction is STUCK because you paid ${currentGas.toFixed(2)} Gwei, but the network currently requires at least ${networkGas.toFixed(2)} Gwei. You need to replace this transaction with a higher fee.`;
          } else {
            diagnosis = `⏳ Your transaction is pending. The fee you paid (${currentGas.toFixed(2)} Gwei) is adequate for the current network. It should be confirmed soon.`;
            statusColor = "yellow";
          }
        } else {
          diagnosis = "❌ Transaction hash not found. Please check if you copied the full hash.";
          statusColor = "red";
        }

        setResult({ diagnosis, statusColor, currentGas, networkGas, isMined });
      }
    } catch (err) {
      setError("Something went wrong. Check the terminal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-2">Crypto Transaction Fixer</h1>
        <p className="text-gray-400 text-center mb-6">Paste your transaction hash to check its status.</p>
        
        <input
          type="text"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="0x..."
          className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500 mb-4"
        />
        
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-bold py-3 px-4 rounded transition duration-200"
        >
          {loading ? "Analyzing..." : "Analyze Transaction"}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        {result && (
          <div className={`mt-6 p-4 rounded border ${
            result.statusColor === 'green' ? 'bg-green-900/30 border-green-700' : 
            result.statusColor === 'red' ? 'bg-red-900/30 border-red-700' : 
            'bg-yellow-900/30 border-yellow-700'
          }`}>
            <p className="text-sm font-semibold mb-2">Diagnosis:</p>
            <p className="text-sm">{result.diagnosis}</p>
          </div>
        )}
      </div>
    </main>
  );
}