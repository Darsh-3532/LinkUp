// Test script for new visualization features in network_explorer.html
// This script tests the new functions: showBipartiteDiagram, showFundingDistribution,
// showDegreeDistribution, showConnectedComponents, and showAPIPerformance

// Mock network data for testing
const mockNetworkData = {
  nodes: [
    { id: '1', name: 'TechCorp', type: 'company', industry: 'Software' },
    { id: '2', name: 'DataSys', type: 'company', industry: 'Data Analytics' },
    { id: '3', name: 'VC Partners', type: 'investor', type_of_investor: 'Venture Capital' },
    { id: '4', name: 'Angel Group', type: 'investor', type_of_investor: 'Angel Investor' },
    { id: '5', name: 'FinTech Inc', type: 'company', industry: 'Financial Technology' }
  ],
  edges: [
    { source: '1', target: '3', funding_type: 'Series A' },
    { source: '2', target: '3', funding_type: 'Seed' },
    { source: '5', target: '4', funding_type: 'Series B' },
    { source: '1', target: '4', funding_type: 'Series A' }
  ]
};

// Test results object
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(testName, passed, message = '') {
  const status = passed ? 'PASS' : 'FAIL';
  const color = passed ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';

  console.log(`${color}[${status}]${reset} ${testName}${message ? ': ' + message : ''}`);

  testResults.tests.push({ testName, passed, message });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// Test 1: Check if functions exist
function testFunctionExistence() {
  const functions = [
    'showBipartiteDiagram',
    'showFundingDistribution',
    'showDegreeDistribution',
    'showConnectedComponents',
    'showAPIPerformance'
  ];

  functions.forEach(funcName => {
    const exists = typeof window[funcName] === 'function';
    logTest(`Function ${funcName} exists`, exists);
  });
}

// Test 2: Test showBipartiteDiagram function
function testShowBipartiteDiagram() {
  try {
    // Set up mock data
    window.networkData = mockNetworkData;
    window.currentLayout = 'force';

    // Call the function
    showBipartiteDiagram();

    // Check if layout was changed
    const layoutChanged = window.currentLayout === 'bipartite';
    logTest('showBipartiteDiagram changes layout to bipartite', layoutChanged);

    // Check if notification was shown (we can't easily test DOM, but function should not throw)
    logTest('showBipartiteDiagram executes without error', true);

  } catch (error) {
    logTest('showBipartiteDiagram executes without error', false, error.message);
  }
}

// Test 3: Test showFundingDistribution function
function testShowFundingDistribution() {
  try {
    window.networkData = mockNetworkData;

    // Mock the showAnalysisResults function since we can't test DOM
    window.showAnalysisResults = function(title, content) {
      console.log(`Analysis Results: ${title}`);
      return true;
    };

    showFundingDistribution();
    logTest('showFundingDistribution executes without error', true);

  } catch (error) {
    logTest('showFundingDistribution executes without error', false, error.message);
  }
}

// Test 4: Test showDegreeDistribution function
function testShowDegreeDistribution() {
  try {
    window.networkData = mockNetworkData;
    window.showAnalysisResults = function(title, content) {
      console.log(`Analysis Results: ${title}`);
      return true;
    };

    showDegreeDistribution();
    logTest('showDegreeDistribution executes without error', true);

  } catch (error) {
    logTest('showDegreeDistribution executes without error', false, error.message);
  }
}

// Test 5: Test showConnectedComponents function
function testShowConnectedComponents() {
  try {
    window.networkData = mockNetworkData;
    window.showAnalysisResults = function(title, content) {
      console.log(`Analysis Results: ${title}`);
      return true;
    };
    window.showNotification = function(message, type) {
      console.log(`Notification: ${message} (${type})`);
      return true;
    };

    showConnectedComponents();
    logTest('showConnectedComponents executes without error', true);

  } catch (error) {
    logTest('showConnectedComponents executes without error', false, error.message);
  }
}

// Test 6: Test showAPIPerformance function
function testShowAPIPerformance() {
  try {
    window.showAnalysisResults = function(title, content) {
      console.log(`Analysis Results: ${title}`);
      return true;
    };

    showAPIPerformance();
    logTest('showAPIPerformance executes without error', true);

  } catch (error) {
    logTest('showAPIPerformance executes without error', false, error.message);
  }
}

// Test 7: Test API connectivity
async function testAPIConnectivity() {
  try {
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();

    const apiHealthy = data.success === true;
    logTest('Backend API health check', apiHealthy);

  } catch (error) {
    logTest('Backend API health check', false, 'API not accessible: ' + error.message);
  }
}

// Test 8: Test network data loading
async function testNetworkDataLoading() {
  try {
    const response = await fetch('http://localhost:5000/api/network');
    const data = await response.json();

    const hasData = data.success === true && data.data && data.data.nodes && data.data.edges;
    logTest('Network data API returns valid data', hasData);

    if (hasData) {
      const nodeCount = data.data.nodes.length;
      const edgeCount = data.data.edges.length;
      logTest('Network data contains nodes and edges', nodeCount > 0 && edgeCount > 0,
              `Nodes: ${nodeCount}, Edges: ${edgeCount}`);
    }

  } catch (error) {
    logTest('Network data API returns valid data', false, error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Testing New Visualization Features\n');

  // Test function existence first
  testFunctionExistence();

  console.log('\n📊 Testing Function Execution\n');

  // Test each function
  testShowBipartiteDiagram();
  testShowFundingDistribution();
  testShowDegreeDistribution();
  testShowConnectedComponents();
  testShowAPIPerformance();

  console.log('\n🌐 Testing API Connectivity\n');

  // Test API connectivity
  await testAPIConnectivity();
  await testNetworkDataLoading();

  console.log('\n📈 Test Summary\n');

  console.log(`Total Tests: ${testResults.tests.length}`);
  console.log(`Passed: ${testResults.passed}`);
  console.log(`Failed: ${testResults.failed}`);

  const successRate = (testResults.passed / testResults.tests.length * 100).toFixed(1);
  console.log(`Success Rate: ${successRate}%`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests.filter(t => !t.passed).forEach(test => {
      console.log(`  - ${test.testName}: ${test.message}`);
    });
  }

  return testResults.failed === 0;
}

// Export for use in browser console or Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runTests, testResults };
} else {
  // Browser environment - run tests when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runTests);
  } else {
    runTests();
  }
}
