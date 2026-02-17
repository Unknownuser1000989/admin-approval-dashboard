const { Innertube, UniversalCache } = require('youtubei.js');
const { tavily } = require('@tavily/core');

const videoId = 'DeJk1cQtOzc';

async function testFallback() {
    console.log('--- Testing Fallback Logic ---');

    if (!process.env.TAVILY_API_KEY) {
        console.error('No TAVILY_API_KEY found.');
        return;
    }

    try {
        // 1. Get Title
        const youtube = await Innertube.create({
            cache: new UniversalCache(false),
            generate_session_locally: true
        });
        const info = await youtube.getInfo(videoId);
        const videoTitle = info.basic_info.title;
        console.log(`Captured Title: ${videoTitle}`);

        // 2. Search Tavily
        const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });
        const query = `${videoTitle} video summary review`;
        console.log(`Searching: ${query}`);

        const searchResult = await tvly.search(query, {
            search_depth: "advanced",
            include_answer: true,
            max_results: 5
        });

        console.log('\n--- Tavily AI Answer ---');
        console.log(searchResult.answer);

        console.log('\n--- Top Result ---');
        if (searchResult.results.length > 0) {
            console.log(`Title: ${searchResult.results[0].title}`);
            console.log(`URL: ${searchResult.results[0].url}`);
            console.log(`Content: ${searchResult.results[0].content.substring(0, 150)}...`);
        } else {
            console.log('No results found.');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

testFallback();
