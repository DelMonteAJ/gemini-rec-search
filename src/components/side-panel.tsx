import React, { useEffect, useState } from "react";
import { checkDomainAndPrompt, grabContent } from "../libs";
import { SearchResult } from "./search-result";
import classes from "./side-panel.module.css";
import { ApiService } from "../services/api-service";
import { ScanPopup } from "./scan-popup";
import { aiService } from "../services/ai-service";

const SidePanel: React.FC = () => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldScan, setShouldScan] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [currentDomain, setCurrentDomain] = useState<string>("");
  const [domainList, setDomainList] = useState<string[]>([]);

  const handleGrabContent = async () => {
    const content = await grabContent();
    console.log(content);
    return content;
  };

  const handleConfirm = () => {
    setShouldScan(true);
    runScan();
  };

  const handleCancel = () => {
    setShouldScan(false);
  };

  let debounceTimeout: NodeJS.Timeout | null = null;

  const runScan = async () => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    debounceTimeout = setTimeout(async () => {
      const { currentDomain, domainList, shouldScan, showPopup, currentUrl } =
        await checkDomainAndPrompt();

      setShouldScan(shouldScan);
      setShowPopup(showPopup);
      setDomainList(domainList);
      setCurrentDomain(currentDomain);

      if (shouldScan) {
        setIsLoading(true);
        console.log("Scanning the page for url", currentUrl);
        const pageContent = await handleGrabContent();
        console.log("page content", pageContent.slice(0, 300));

        const query = await aiService.prompt(pageContent.slice(0, 2000));
        ApiService.search(query!)
          .then((data) => {
            const results = data.searchResults;
            setSearchResults(results);
          })
          .catch((error) => {
            console.error("Error processing search results:", error);
            setSearchResults([]);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }, 200);
  };

  useEffect(() => {
    // Run once when the sidebar opens
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab?.url) {
        runScan();
      }
    });

    // Listen for tab changes
    const handleTabChange = async (activeInfo: chrome.tabs.TabActiveInfo) => {
      console.log("running scan on tab change");
      setSearchResults([]);
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab.url) {
          runScan();
        }
      });
    };

    const handleTabUpdate = async (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab
    ) => {
      console.log("running scan on tab change");
      setSearchResults([]);
      chrome.tabs.get(tabId, (tab) => {
        if (tab.url) {
          runScan();
        }
      });
    };

    // Listen for page loads on any website
    const handlePageLoad = (
      details: chrome.webNavigation.WebNavigationFramedCallbackDetails
    ) => {
      setSearchResults([]);
      if (details.frameId === 0) {
        chrome.tabs.get(details.tabId, (tab) => {
          if (tab.url) {
            runScan();
          }
        });
      }
    };

    chrome.tabs.onUpdated.addListener(handleTabUpdate);
    chrome.tabs.onActivated.addListener(handleTabChange);

    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdate);
      chrome.tabs.onActivated.removeListener(handleTabChange);
    };
  }, []);

  const SidePanelContent = () => {
    if (showPopup) {
      return null;
    }

    // TODO: Highlight the first two results in like a Google AI looking color border
    return (
      <div className={classes.searchResults}>
        {isLoading ? (
          <div className={classes.loaderContainer}>
            <p>Loading recommendations...</p>
            <div className={classes.loader}></div>
          </div>
        ) : searchResults?.length > 0 ? (
          searchResults.map((result, index) => (
            <SearchResult
              key={index}
              url={result.url}
              title={result.title}
              description={result.description}
              highlighted={index < 2}
            />
          ))
        ) : (
          <p>No recommendations found.</p>
        )}
      </div>
    );
  };

  const SidePanelHeader = () => {
    return searchResults?.length > 0 ? (
      <>
        <h1>Recommended Pages</h1>
        <p>These recommended sites were found based on your current page.</p>
      </>
    ) : (
      <>
        <h1>Gemini Search</h1>
        <p>Visit a website or allow access to site to get started.</p>
      </>
    );
  };

  return (
    <div className={classes.sidePanel}>
      <SidePanelHeader />
      <hr className={classes.separator} />
      <SidePanelContent />
      {showPopup && (
        <ScanPopup
          currentDomain={currentDomain}
          domainList={domainList}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          setShowPopup={setShowPopup}
          setShouldScan={setShouldScan}
        />
      )}
    </div>
  );
};

export default SidePanel;
