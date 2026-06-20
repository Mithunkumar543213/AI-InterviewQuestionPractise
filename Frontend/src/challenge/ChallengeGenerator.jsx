import "react"
import { useState, useEffect } from "react"
import { MCQChallenge } from "./MCQChallenge.jsx"
import { useApi } from "../utils/api.js"

export function ChallengeGenerator() {
    const [challenge, setChallenge] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)

    const [interviewRole, setInterviewRole] = useState("")
    const [experience, setExperience] = useState("fresher")
    const [difficulty, setDifficulty] = useState("easy")
    const [questionCount, setQuestionCount] = useState(2)

    const [quota, setQuota] = useState(null)

    const { makeRequest } = useApi()

    useEffect(() => {
        fetchQuota()
    }, [])

    const fetchQuota = async () => {
        try {
            const data = await makeRequest("quota")
            setQuota(data)
        } catch (err) {
            console.log(err)
        }
    }

    const generateChallenge = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const data = await makeRequest("generate-challenge", {
                method: "POST",
                body: JSON.stringify({
                    interviewRole,
                    experience,
                    difficulty,
                    questionCount
                })
            })

    

            // backend returns { questions: [...] }
            setChallenge(data.questions)

            fetchQuota()
        } catch (err) {
            setError(err.message || "Failed to generate interview questions.")
        } finally {
            setIsLoading(false)
        }
    }

    const getNextResetTime = () => {
        if (!quota?.last_reset_date) return null

        const resetDate = new Date(quota.last_reset_date)
        resetDate.setHours(resetDate.getHours() + 24)

        return resetDate
    }

    return (
        <div className="challenge-container">

            <div className="hero-section">
                <h1>AI Interview Practice Platform</h1>
                <p>
                    Practice real interview questions powered by AI and improve your confidence.
                </p>
            </div>

            <div className="quota-display">
                <p>
                    Remaining Questions Today:
                    <strong> {quota?.quota_remaining || 0}</strong>
                </p>

                {quota?.quota_remaining === 0 && (
                    <p>
                        Next Reset: {getNextResetTime()?.toLocaleString()}
                    </p>
                )}
            </div>

            <div className="form-section">

                <div className="input-group">
                    <label>Interview Role</label>
                    <input
                        type="text"
                        placeholder="e.g. Frontend Developer"
                        value={interviewRole}
                        onChange={(e) => setInterviewRole(e.target.value)}
                    />
                </div>

                <div className="input-group">
                    <label>Experience Level</label>
                    <select
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                    >
                        <option value="fresher">Fresher</option>
                        <option value="1-2 years">1-2 Years</option>
                        <option value="3-5 years">3-5 Years</option>
                        <option value="5+ years">5+ Years</option>
                    </select>
                </div>

                <div className="input-group">
                    <label>Interview Difficulty</label>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                    >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                </div>

                <div className="input-group">
                    <label>Number of Questions</label>
                    <input
                        type="number"
                        min="1"
                        max="20"
                        value={questionCount}
                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                    />
                </div>

            </div>

            <button
                onClick={generateChallenge}
                disabled={isLoading || !interviewRole}
                className="generate-button"
            >
                {isLoading ? "Generating AI Questions..." : "Generate Questions"}
            </button>

            {error && (
                <div className="error-message">
                    <p>{error}</p>
                </div>
            )}

            {/* Render multiple questions */}
            {challenge.length > 0 &&
                challenge.map((item, index) => (
                    <MCQChallenge
                        key={item.id || index}
                        challenge={item}
                    />
                ))
            }

        </div>
    )
}






// import "react"
// import {useState, useEffect} from "react"
// import {MCQChallenge} from "./MCQChallenge.jsx";
// import {useApi} from "../utils/api.js"

// export function ChallengeGenerator() {
//     const [challenge, setChallenge] = useState(null)
//     const [isLoading, setIsLoading] = useState(false)
//     const [error, setError] = useState(null)
//     const [difficulty, setDifficulty] = useState("easy")
//     const [quota, setQuota] = useState(null)
//     const {makeRequest} = useApi()

//     useEffect(() => {
//         fetchQuota()
//     }, [])

//     const fetchQuota = async () => {
//         try {
//             const data = await makeRequest("quota")
//             setQuota(data)
//         } catch (err) {
//             console.log(err)
//         }
//     }

//     const generateChallenge = async () => {
//         setIsLoading(true)
//         setError(null)

//         try {
//             const data = await makeRequest("generate-challenge", {
//                 method: "POST",
//                 body: JSON.stringify({difficulty})
//                 }
//             )
//             setChallenge(data)
//             fetchQuota()
//         } catch (err) {
//             setError(err.message || "Failed to generate challenge.")
//         } finally {
//             setIsLoading(false)
//         }
//     }

//     const getNextResetTime = () => {
//         if (!quota?.last_reset_data) return null
//         const resetDate = new Date(quota.last_reset_data)
//         resetDate.setHours(resetDate.getHours() + 24)
//         return resetDate
//     }

//     return <div className="challenge-container">
//         <h2>Coding Challenge Generator</h2>

//         <div className="quota-display">
//             <p>Challenges remaining today: {quota?.quota_remaining || 0}</p>
//             {quota?.quota_remaining === 0 && (
//                 <p>Next reset: {getNextResetTime()?.toLocaleString()}</p>
//             )}
//         </div>
//         <div className="difficulty-selector">
//             <label htmlFor="difficulty">Select Difficulty</label>
//             <select
//                 id="difficulty"
//                 value={difficulty}
//                 onChange={(e) => setDifficulty(e.target.value)}
//                 disabled={isLoading}
//             >
//                 <option value="easy">Easy</option>
//                 <option value="medium">Medium</option>
//                 <option value="hard">Hard</option>
//             </select>
//         </div>

//         <button
//             onClick={generateChallenge}
//             disabled={false }
//             className="generate-button"
//         >
//             {isLoading ? "Generating..." : "Generate Challenge"}
//         </button>

//         {error && <div className="error-message">
//             <p>{error}</p>
//         </div>}

//         {challenge && <MCQChallenge challenge={challenge}/>}
//     </div>
// }