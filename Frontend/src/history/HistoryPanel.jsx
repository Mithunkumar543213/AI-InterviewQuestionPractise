import "react"
import { useState, useEffect } from "react"
import { MCQChallenge } from "../challenge/MCQChallenge.jsx"
import { useApi } from "../utils/api.js"

export function HistoryPanel() {
    const { makeRequest } = useApi()
    const [history, setHistory] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const data = await makeRequest("my-history")
            setHistory(data.challenges)
        } catch (err) {
            setError("Failed to load history.")
        } finally {
            setIsLoading(false)
        }
    }

    const clearHistory = async () => {
        const confirmDelete = window.confirm(
            "Are you sure you want to clear all history?"
        )

        if (!confirmDelete) return

        try {
            await makeRequest("clear-history", {
                method: "DELETE"
            })

            setHistory([])
        } catch (err) {
            setError("Failed to clear history.")
        }
    }

    if (isLoading) {
        return <div className="loading">Loading history...</div>
    }

    if (error) {
        return (
            <div className="error-message">
                <p>{error}</p>
                <button onClick={fetchHistory}>Retry</button>
            </div>
        )
    }

    return (
        <div className="history-panel">

            <div className="history-header">
                <h2>History</h2>

                {history.length > 0 && (
                    <button
                        className="clear-history-btn"
                        onClick={clearHistory}
                    >
                        Clear History
                    </button>
                )}
            </div>

            {history.length === 0 ? (
                <p>No challenge history</p>
            ) : (
                <div className="history-list">
                    {history.map((challenge) => (
                        <MCQChallenge
                            challenge={challenge}
                            key={challenge.id}
                            showExplanation
                        />
                    ))}
                </div>
            )}
        </div>
    )
}