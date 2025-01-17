import { JsonRpcProvider } from '@ethersproject/providers'
import { SwapRouter, Trade } from '@uniswap/router-sdk'
import { arbitrumTokens, bscTokens } from '@pancakeswap/tokens'
import { Currency, CurrencyAmount, Percent, Token, TradeType } from '@uniswap/sdk-core'
import {
  AlphaRouter,
  SwapType,
} from '@uniswap/smart-order-router'
import { useState, useEffect, useMemo, useCallback } from 'react'

// ! base 链路由地址
// https://basescan.org/address/0x2626664c2603336e57b271c5c0b26f421741e481
// const baseRouterAddress = '0x2626664c2603336E57B271c5C0b26F421741e481'

const recipient = '0xa14220a44eaE936F96569031F9c11ba7E9aFB989'

const getChainToken = (chain: 'BNB' | 'BASE' | 'ARB' | 'polygon') => {
  switch (chain) {
    // 可用
    case 'BNB':
      return {
        chainId: 56,
        from: bscTokens.usdt,
        to: bscTokens.doge,
        // from: new Token(56, '0x55d398326f99059fF775485246999027B3197955', 18, 'USDT'),
        // to: new Token(56, '0xbA2aE424d960c26247Dd6c32edC70B295c744C43', 8, 'DOGE'),
        rpc: 'https://bsc-dataseed2.binance.org',
      }
    // ! Error: Could not parse fraction
    case 'BASE':
      return {
        chainId: 8453,
        // from: baseTokens.usdc,
        // to: baseTokens.dai,
        from: new Token(8453, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6, 'USDC'),
        to: new Token(8453, '0x2F20Cf3466f80A5f7f532fCa553c8cbc9727FEf6', 18, 'AKUMA'),
        rpc: 'https://1rpc.io/base',
      }
    // ! Error: Could not parse fraction
    case 'ARB':
      return {
        chainId: 42161,
        from: arbitrumTokens.usdt,
        to: new Token(42161, '0x912CE59144191C1204E64559FE8253a0e49E6548', 18, 'ARB'),
        rpc: 'https://arb1.arbitrum.io/rpc',
      }
    // 可用
    case 'polygon':
      return {
        chainId: 137,
        from: new Token(137, '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', 6, 'USDC'),
        to: new Token(137, '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', 18, 'DAI'),
        rpc: 'https://polygon-rpc.com',
      }
    default:
      return {
        chainId: 8453,
        from: new Token(8453, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6, 'USDC'),
        to: new Token(8453, '0x2F20Cf3466f80A5f7f532fCa553c8cbc9727FEf6', 18, 'AKUMA'),
        rpc: 'https://1rpc.io/base',
      }
  }
}

const { chainId, from: fromToken, to: toToken, rpc } = getChainToken('BNB')

const provider = new JsonRpcProvider(rpc)
const router = new AlphaRouter({
  chainId,
  provider
})
/**
 * UniSwap 智能路由获取
 */
export default function useUniRouter() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trade, setTrade] = useState<Trade<Currency, Currency, TradeType> | null>(null)

  const swapFrom = useMemo(() => fromToken, [])
  const swapTo = useMemo(() => toToken, [])

  const getBestRoute = useCallback(
    async (amountIn: number) => {
      if (!swapFrom || !swapTo) return null

      try {
        const currencyAmount = CurrencyAmount.fromRawAmount(swapFrom, amountIn * 10 ** swapFrom.decimals)
        console.log('数量：', currencyAmount.toExact(), swapFrom.symbol)
        setLoading(true)
        console.log('currencyAmount:', currencyAmount)
        console.log('swapTo:', swapTo)
        console.log('recipient:', recipient)

        const route = await router.route(
          currencyAmount,
          swapTo,
          TradeType.EXACT_INPUT,
          {
            type: SwapType.SWAP_ROUTER_02,
            slippageTolerance: new Percent(5, 10_000),
            deadline: Math.floor(Date.now() / 1000) + 1800,
            recipient,
          }
          // {
          //   maxSplits: 2,
          //   maxSwapsPerPath: 2,
          //   protocols: [Protocol.V2, Protocol.V3],
          // }
        )
        setLoading(false)
        console.log('[UniSwap getBestRoute set trade success]', route)
        setTrade(route?.trade || null)
      } catch (error) {
        console.log('UniSwap getBestRoute Error：', error)
        setLoading(false)
        setError(error as string)
      }
    },
    [swapFrom, swapTo, setLoading, setError]
  )

  // 将此处的参数构建出来后传给后端
  const swapCallParams = useMemo(() => {
    if (!trade) return null

    const { value, calldata } = SwapRouter.swapCallParameters(trade, {
      recipient: recipient,
      slippageTolerance: new Percent(5, 1000),
    })

    console.log('[UniSwap swapCallParams]', {
      calldata,
      value,
      // to: SMART_ROUTER_ADDRESSES[56],
    })

    return {
      // address: SMART_ROUTER_ADDRESSES[56],
      calldata,
      value,
    }
  }, [trade])

  useEffect(() => {
    if (trade && swapTo) {
      console.log(`[UniSwap] 兑换 ${trade?.outputAmount.toExact() || '?'} ${swapTo.symbol}`)
    }
  }, [trade, swapTo])

  return {
    getBestRoute,
    swapCallParams,
    loading,
    error,
  }
}
