import { useEffect } from 'react'
import './App.css'
import useUniRouter from './hooks/useUniRouter'

function App() {
  const { getBestRoute, swapCallParams } = useUniRouter()

  useEffect(() => {
    if (swapCallParams) {
      console.log('成功拿到 swapCallParams：', swapCallParams)
    }
  }, [swapCallParams])

  return (
    <>
      <h1>Swap Router test</h1>
      <div className="card">
        <button onClick={() => getBestRoute(2)}>
          点击询价
        </button>
      </div>
    </>
  )
}

export default App
