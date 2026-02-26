// Test script for the three report subfigure functions
// This simulates the functions I added to verify they work with the actual data structure

// Load the network data (simulating what would come from the API)
const networkData = require('./network_data.json');

// Function 1: Company Degree Subgraph - Analyzes companies with 3+ funding relationships
function analyzeCompanyDegreeSubgraph() {
    console.log("Testing: Company Degree Subgraph");

    // Count funding relationships per company
    const companyDegrees = {};

    networkData.edges.forEach(edge => {
        // Find target node to check if it's a company
        const targetNode = networkData.nodes.find(node => node.id === edge.target);
        if (targetNode && targetNode.type === 'company') {
            companyDegrees[edge.target] = (companyDegrees[edge.target] || 0) + 1;
        }
    });

    // Filter companies with 3+ funding relationships
    const highDegreeCompanies = Object.entries(companyDegrees)
        .filter(([companyId, degree]) => degree >= 3)
        .map(([companyId, degree]) => {
            const company = networkData.nodes.find(node => node.id === companyId);
            return {
                name: company ? company.name : companyId,
                degree: degree,
                category: company ? company.category : 'unknown'
            };
        });

    console.log(`Found ${highDegreeCompanies.length} companies with 3+ funding relationships`);
    console.log("Sample results:", highDegreeCompanies.slice(0, 5));

    return highDegreeCompanies;
}

// Function 2: Investor Activity Subgraph - Shows highest degree value investors
function analyzeInvestorActivitySubgraph() {
    console.log("Testing: Investor Activity Subgraph");

    // Count investments per investor
    const investorActivity = {};

    networkData.edges.forEach(edge => {
        // Find source node to check if it's an investor
        const sourceNode = networkData.nodes.find(node => node.id === edge.source);
        if (sourceNode && sourceNode.type === 'investor') {
            investorActivity[edge.source] = (investorActivity[edge.source] || 0) + 1;
        }
    });

    // Sort investors by activity (number of investments)
    const topInvestors = Object.entries(investorActivity)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10) // Top 10 most active investors
        .map(([investorId, activity]) => {
            const investor = networkData.nodes.find(node => node.id === investorId);
            return {
                name: investor ? investor.name : investorId,
                activity: activity,
                investor_type: investor ? investor.investor_type : 'unknown'
            };
        });

    console.log(`Found ${topInvestors.length} most active investors`);
    console.log("Top investors:", topInvestors);

    return topInvestors;
}

// Function 3: Funding Timeline Plot - Displays chronological funding distribution
function analyzeFundingTimelinePlot() {
    console.log("Testing: Funding Timeline Plot");

    // Since most funded_at values are "unknown", we'll analyze by funding_round_type
    const fundingTypes = {};

    networkData.edges.forEach(edge => {
        const roundType = edge.funding_round_type || 'unknown';
        fundingTypes[roundType] = (fundingTypes[roundType] || 0) + 1;
    });

    // Also analyze by raised_amount ranges (since most are 0.0)
    const amountRanges = {
        'no_data': 0,
        'small': 0,
        'medium': 0,
        'large': 0
    };

    networkData.edges.forEach(edge => {
        const amount = edge.raised_amount || 0;
        if (amount === 0) {
            amountRanges.no_data++;
        } else if (amount < 1000000) {
            amountRanges.small++;
        } else if (amount < 10000000) {
            amountRanges.medium++;
        } else {
            amountRanges.large++;
        }
    });

    console.log("Funding round types distribution:", fundingTypes);
    console.log("Funding amount ranges:", amountRanges);

    return { fundingTypes, amountRanges };
}

// Run the tests
console.log("=== Testing Report Subfigure Functions ===\n");

try {
    const companyResults = analyzeCompanyDegreeSubgraph();
    console.log("\n" + "=".repeat(50) + "\n");

    const investorResults = analyzeInvestorActivitySubgraph();
    console.log("\n" + "=".repeat(50) + "\n");

    const timelineResults = analyzeFundingTimelinePlot();
    console.log("\n" + "=".repeat(50) + "\n");

    console.log("✅ All functions executed successfully!");
    console.log(`📊 Data summary: ${networkData.nodes.length} nodes, ${networkData.edges.length} edges`);

} catch (error) {
    console.error("❌ Error during testing:", error);
}
