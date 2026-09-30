import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { hash } = await req.json();
  const API_KEY = process.env.ETHERSCAN_API_KEY;

  if (!API_KEY) return NextResponse.json({ error: 'API key missing' }, { status: 500 });
  if (!hash) return NextResponse.json({ error: 'Hash is required' }, { status: 400 });

  try {
    // 1. Fetch transaction details
    const txRes = await fetch(`https://api.etherscan.io/v2/api?chainid=1&module=proxy&action=eth_getTransactionByHash&txhash=${hash}&apikey=${API_KEY}`);
    const txData = await txRes.json();

    // 2. Fetch transaction receipt (to check success/fail)
    const receiptRes = await fetch(`https://api.etherscan.io/v2/api?chainid=1&module=proxy&action=eth_getTransactionReceipt&txhash=${hash}&apikey=${API_KEY}`);
    const receiptData = await receiptRes.json();

    // 3. Fetch current gas price
    const gasRes = await fetch(`https://api.etherscan.io/v2/api?chainid=1&module=gastracker&action=gasoracle&apikey=${API_KEY}`);
    const gasData = await gasRes.json();

    return NextResponse.json({ 
      tx: txData.result, 
      receipt: receiptData.result,
      gas: gasData.result 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data from Etherscan' }, { status: 500 });
  }
}