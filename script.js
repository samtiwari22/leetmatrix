document.addEventListener("DOMContentLoaded", function() {
            const searchButton = document.getElementById("search-btn");
            const usernameInput = document.getElementById("user-input");
            const statsContainer = document.querySelector(".stats-container");
            const easyProgressCircle = document.querySelector(".easy-progress");
            const mediumProgressCircle = document.querySelector(".medium-progress");
            const hardProgressCircle = document.querySelector(".hard-progress");
            const easyLabel = document.getElementById("easy-label");
            const mediumLabel = document.getElementById("medium-label");
            const hardLabel = document.getElementById("hard-label");
            const cardStatsContainer = document.querySelector(".stats-cards");

            // Proxy servers to bypass CORS
            const proxies = [
                'https://cors.redoc.ly/',
                'https://cors.sh/',
                'https://thingproxy.freeboard.io/fetch/',
                'https://api.proxycors.com/',
                '' // Direct call as fallback
            ];

            // Sample user data for different scenarios
            const sampleUsers = {
                'demo': {
                    username: 'demo',
                    easy: { solved: 120, total: 800 },
                    medium: { solved: 85, total: 1600 },
                    hard: { solved: 25, total: 700 },
                    totalSubmissions: 450,
                    acceptanceRate: 68.5
                },
                'leetcode': {
                    username: 'leetcode',
                    easy: { solved: 200, total: 800 },
                    medium: { solved: 150, total: 1600 },
                    hard: { solved: 50, total: 700 },
                    totalSubmissions: 800,
                    acceptanceRate: 75.2
                },
                'beginner': {
                    username: 'beginner',
                    easy: { solved: 45, total: 800 },
                    medium: { solved: 12, total: 1600 },
                    hard: { solved: 2, total: 700 },
                    totalSubmissions: 120,
                    acceptanceRate: 49.2
                },
                'expert': {
                    username: 'expert',
                    easy: { solved: 350, total: 800 },
                    medium: { solved: 420, total: 1600 },
                    hard: { solved: 180, total: 700 },
                    totalSubmissions: 1200,
                    acceptanceRate: 85.4
                }
            };

            // Add Enter key support
            usernameInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    searchButton.click();
                }
            });

            function validateUsername(username) {
                if (username.trim() === "") {
                    showMessage("Username should not be empty", "error");
                    return false;
                }
                return true;
            }

            function showMessage(message, type = "info") {
                const messageClass = type === "error" ? "info-message" : 
                                   type === "success" ? "success-message" : "info-message";
                
                // Remove existing messages
                const existingMessage = cardStatsContainer.querySelector('.success-message, .info-message');
                if (existingMessage) {
                    existingMessage.remove();
                }
                
                const messageDiv = document.createElement('div');
                messageDiv.className = messageClass;
                messageDiv.innerHTML = message;
                cardStatsContainer.insertBefore(messageDiv, cardStatsContainer.firstChild);
                
                // Auto remove after 3 seconds for success messages
                if (type === "success") {
                    setTimeout(() => {
                        if (messageDiv.parentNode) {
                            messageDiv.remove();
                        }
                    }, 3000);
                }
            }

            async function fetchUserDetails(username) {
                try {
                    searchButton.innerHTML = '<span class="loading"></span>Searching...';
                    searchButton.disabled = true;
                    cardStatsContainer.innerHTML = '';

                    // Simulate API delay for realism
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Check if it's a sample user
                    if (sampleUsers[username.toLowerCase()]) {
                        const userData = sampleUsers[username.toLowerCase()];
                        displayUserData(userData);
                        showMessage(`✅ Profile loaded successfully for "${userData.username}"`, "success");
                        return;
                    }

                    // Try to fetch from actual LeetCode API with proxies
                    try {
                        const response = await attemptRealAPI(username);
                        if (response && response.data && response.data.matchedUser) {
                            displayRealUserData(response);
                            showMessage(`✅ Real profile data loaded for "${username}"`, "success");
                            return;
                        }
                    } catch (apiError) {
                        console.log("Real API failed:", apiError.message);
                    }

                    // If real API fails, generate realistic fake data
                    const fakeData = generateFakeData(username);
                    displayUserData(fakeData);
                    showMessage(`📊 Generated sample data for "${username}" (Real API unavailable due to CORS)`, "info");

                } catch (error) {
                    console.error("Error:", error);
                    showMessage(`❌ Error: ${error.message}`, "error");
                    resetProgressCircles();
                } finally {
                    searchButton.innerHTML = "Search";
                    searchButton.disabled = false;
                }
            }

            async function attemptRealAPI(username) {
                const apiUrl = 'https://leetcode.com/graphql/';
                const query = `
                    query userSessionProgress($username: String!) {
                        allQuestionsCount {
                            difficulty
                            count
                        }
                        matchedUser(username: $username) {
                            submitStats {
                                acSubmissionNum {
                                    difficulty
                                    count
                                    submissions
                                }
                                totalSubmissionNum {
                                    difficulty
                                    count
                                    submissions
                                }
                            }
                        }
                    }
                `;

                for (const proxy of proxies) {
                    try {
                        const response = await fetch(proxy + apiUrl, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                query,
                                variables: { username }
                            })
                        });

                        if (!response.ok) {
                            throw new Error(`HTTP error with proxy ${proxy || 'direct'}: Status ${response.status}`);
                        }

                        const data = await response.json();
                        if (data.errors) {
                            throw new Error(data.errors[0].message);
                        }

                        return data;
                    } catch (error) {
                        console.warn(`Proxy ${proxy || 'direct'} failed: ${error.message}`);
                        // Continue to the next proxy
                    }
                }

                throw new Error('All proxy attempts failed');
            }

            function generateFakeData(username) {
                // Generate realistic fake data based on username
                const hash = simpleHash(username);
                const easyBase = 50 + (hash % 150);
                const mediumBase = 20 + (hash % 100);
                const hardBase = 5 + (hash % 40);
                
                return {
                    username,
                    easy: { solved: easyBase, total: 800 },
                    medium: { solved: mediumBase, total: 1600 },
                    hard: { solved: hardBase, total: 700 },
                    totalSubmissions: easyBase * 2 + mediumBase * 3 + hardBase * 4,
                    acceptanceRate: 45 + (hash % 35)
                };
            }

            function simpleHash(str) {
                let hash = 0;
                for (let i = 0; i < str.length; i++) {
                    const char = str.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                return Math.abs(hash);
            }

            function updateProgress(solved, total, label, circle) {
                const progressDegree = Math.min((solved / total) * 100, 100);
                circle.style.setProperty("--progress-degree", `${progressDegree}%`);
                label.textContent = `${solved}/${total}`;
            }

            function displayUserData(userData) {
                // Update progress circles
                updateProgress(userData.easy.solved, userData.easy.total, easyLabel, easyProgressCircle);
                updateProgress(userData.medium.solved, userData.medium.total, mediumLabel, mediumProgressCircle);
                updateProgress(userData.hard.solved, userData.hard.total, hardLabel, hardProgressCircle);

                // Create cards data
                const totalSolved = userData.easy.solved + userData.medium.solved + userData.hard.solved;
                const cardsData = [
                    { label: "Total Problems Solved", value: totalSolved },
                    { label: "Easy Problems Solved", value: userData.easy.solved },
                    { label: "Medium Problems Solved", value: userData.medium.solved },
                    { label: "Hard Problems Solved", value: userData.hard.solved },
                ];

                // Display cards
                cardStatsContainer.innerHTML += cardsData.map(
                    data => `<div class="card">
                        <h4>${data.label}</h4>
                        <p>${data.value}</p>
                    </div>`
                ).join("");
            }

            function displayRealUserData(parsedData) {
                // Handle real API data structure
                const allQuestions = parsedData.data.allQuestionsCount || [];
                const submitStats = parsedData.data.matchedUser?.submitStats;
                
                if (!submitStats) {
                    throw new Error("No submission stats found");
                }

                const findByDifficulty = (difficulty) => 
                    allQuestions.find(q => q.difficulty === difficulty)?.count || 0;
                
                const findSolvedByDifficulty = (difficulty) => 
                    submitStats.acSubmissionNum?.find(q => q.difficulty === difficulty)?.count || 0;

                const userData = {
                    easy: { 
                        solved: findSolvedByDifficulty('Easy'), 
                        total: findByDifficulty('Easy') || 800 
                    },
                    medium: { 
                        solved: findSolvedByDifficulty('Medium'), 
                        total: findByDifficulty('Medium') || 1600 
                    },
                    hard: { 
                        solved: findSolvedByDifficulty('Hard'), 
                        total: findByDifficulty('Hard') || 700 
                    }
                };

                displayUserData(userData);
            }

            function resetProgressCircles() {
                [easyLabel, mediumLabel, hardLabel].forEach(label => label.textContent = '0/0');
                [easyProgressCircle, mediumProgressCircle, hardProgressCircle].forEach(circle => {
                    circle.style.setProperty("--progress-degree", '0%');
                });
            }

            // Event listener for search button
            searchButton.addEventListener('click', function() {
                const username = usernameInput.value.trim();
                console.log("Searching for username: ", username);
                if (validateUsername(username)) {
                    fetchUserDetails(username);
                }
            });

            // Show initial tip
            showMessage('👋 Welcome! Try "demo" for sample data or enter any username to see it in action!', 'info');
        });