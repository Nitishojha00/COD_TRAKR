const problemsData = [
  {
    category: "Arrays & Strings",
    problems: [
      "Two Sum", "Best Time to Buy and Sell Stock", "Contains Duplicate",
      "Product of Array Except Self", "Maximum Subarray (Kadane's)",
      "Maximum Product Subarray", "Find Minimum in Rotated Sorted Array",
      "Search in Rotated Sorted Array", "3Sum", "Container With Most Water"
    ]
  },
  {
    category: "Binary Search",
    problems: [
      "Binary Search", "Find First and Last Position of Element",
      "Search a 2D Matrix", "Koko Eating Bananas"
    ]
  },
  {
    category: "Linked List",
    problems: [
      "Reverse Linked List", "Merge Two Sorted Lists", "Reorder List",
      "Remove Nth Node From End", "Linked List Cycle", "LRU Cache"
    ]
  },
  {
    category: "Sliding Window",
    problems: [
      "Longest Substring Without Repeating Characters",
      "Longest Repeating Character Replacement", "Minimum Window Substring",
      "Permutation in String"
    ]
  },
  {
    category: "Stack & Queue",
    problems: [
      "Valid Parentheses", "Min Stack", "Evaluate Reverse Polish Notation",
      "Generate Parentheses", "Daily Temperatures", "Car Fleet"
    ]
  },
  {
    category: "Trees",
    problems: [
      "Invert Binary Tree", "Maximum Depth of Binary Tree", "Diameter of Binary Tree",
      "Balanced Binary Tree", "Same Tree", "Subtree of Another Tree",
      "Lowest Common Ancestor of BST", "Binary Tree Level Order Traversal",
      "Validate Binary Search Tree", "Kth Smallest Element in BST"
    ]
  },
  {
    category: "Graphs",
    problems: [
      "Number of Islands", "Clone Graph", "Pacific Atlantic Water Flow",
      "Course Schedule", "Number of Connected Components"
    ]
  },
  {
    category: "Dynamic Programming",
    problems: [
      "Climbing Stairs", "House Robber", "Coin Change",
      "Longest Increasing Subsequence", "Word Break"
    ]
  }
];

const container = document.getElementById('problems-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

if (!localStorage.getItem('completedProblems')) {
  localStorage.setItem('completedProblems', JSON.stringify([]));
}

function getCompleted() {
  return JSON.parse(localStorage.getItem('completedProblems'));
}

function updateProgress() {
  const completed = getCompleted();
  const total = 50;
  const count = completed.length;
  const percent = Math.round((count / total) * 100);

  progressBar.style.width = percent + '%';
  progressText.innerText = `${count}/50 (${percent}%)`;
}

function toggleProblem(name) {
  let completed = getCompleted();
  if (completed.includes(name)) {
    completed = completed.filter(p => p !== name);
  } else {
    completed.push(name);
  }
  localStorage.setItem('completedProblems', JSON.stringify(completed));
  renderProblems();
  updateProgress();
}

function renderProblems() {
  const completed = getCompleted();
  container.innerHTML = '';

  problemsData.forEach(cat => {
    const section = document.createElement('div');
    section.className = 'category-section';

    const title = document.createElement('h2');
    title.className = 'category-title';
    title.innerText = cat.category;
    section.appendChild(title);

    cat.problems.forEach(problem => {
      const isCompleted = completed.includes(problem);
      const card = document.createElement('div');
      card.className = `problem-card ${isCompleted ? 'completed' : ''}`;
      card.onclick = () => toggleProblem(problem);

      card.innerHTML = `
                <div class="problem-info">
                    <div class="checkbox-wrapper">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <span class="problem-name">${problem}</span>
                </div>
                <a href="https://leetcode.com/problems/${problem.toLowerCase().replace(/[^a-z0-9]/g, '-')}/" 
                   target="_blank" 
                   class="problem-link"
                   onclick="event.stopPropagation()">
                   <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
            `;
      section.appendChild(card);
    });

    container.appendChild(section);
  });
}

const themeBtn = document.getElementById('theme-toggle');
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
  themeBtn.innerText = '☀️';
}

themeBtn.onclick = () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  themeBtn.innerText = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

renderProblems();
updateProgress();
