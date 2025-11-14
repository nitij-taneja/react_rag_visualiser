#!/usr/bin/env python3
"""
API Testing Script for ReAct RAG System
Tests all endpoints and provides performance metrics
"""

import asyncio
import requests
import json
import time
from typing import Dict, List
import sys

BASE_URL = "http://localhost:8000"


class APITester:
    """Tests ReAct RAG API endpoints"""

    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.results: List[Dict] = []

    def test_health(self) -> bool:
        """Test health endpoint"""
        print("\n🏥 Testing Health Endpoint...")
        try:
            response = requests.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Status: {data.get('status')}")
                print(f"   Version: {data.get('version')}")
                self.results.append({"test": "health", "status": "passed"})
                return True
            else:
                print(f"❌ Failed with status {response.status_code}")
                self.results.append({"test": "health", "status": "failed"})
                return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.results.append({"test": "health", "status": "error", "error": str(e)})
            return False

    def test_document_upload(self) -> bool:
        """Test document upload"""
        print("\n📄 Testing Document Upload...")
        try:
            doc_data = {
                "title": "Test Document",
                "content": "This is a test document about Python programming. Python is a high-level, interpreted programming language known for its simplicity and readability.",
                "mime_type": "text/plain",
            }
            response = requests.post(
                f"{self.base_url}/api/documents/upload", json=doc_data
            )
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    print(f"✅ Document uploaded: {data.get('message')}")
                    self.results.append({"test": "document_upload", "status": "passed"})
                    return True
            print(f"❌ Failed with status {response.status_code}")
            self.results.append({"test": "document_upload", "status": "failed"})
            return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.results.append(
                {"test": "document_upload", "status": "error", "error": str(e)}
            )
            return False

    def test_get_documents(self) -> bool:
        """Test get documents endpoint"""
        print("\n📚 Testing Get Documents...")
        try:
            response = requests.get(f"{self.base_url}/api/documents")
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    count = data.get("count", 0)
                    print(f"✅ Retrieved {count} documents")
                    self.results.append({"test": "get_documents", "status": "passed"})
                    return True
            print(f"❌ Failed with status {response.status_code}")
            self.results.append({"test": "get_documents", "status": "failed"})
            return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.results.append(
                {"test": "get_documents", "status": "error", "error": str(e)}
            )
            return False

    def test_query_processing(self) -> bool:
        """Test query processing endpoint"""
        print("\n🧠 Testing Query Processing...")
        try:
            query_data = {"query": "What is Python?"}
            start_time = time.time()
            response = requests.post(f"{self.base_url}/api/query", json=query_data)
            elapsed_time = time.time() - start_time

            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    steps = len(data.get("steps", []))
                    print(f"✅ Query processed in {elapsed_time:.2f}s")
                    print(f"   Steps: {steps}")
                    print(f"   Result preview: {data.get('result', '')[:100]}...")
                    self.results.append(
                        {
                            "test": "query_processing",
                            "status": "passed",
                            "time_seconds": elapsed_time,
                            "steps": steps,
                        }
                    )
                    return True
            print(f"❌ Failed with status {response.status_code}")
            self.results.append({"test": "query_processing", "status": "failed"})
            return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.results.append(
                {"test": "query_processing", "status": "error", "error": str(e)}
            )
            return False

    def test_query_history(self) -> bool:
        """Test query history endpoint"""
        print("\n📜 Testing Query History...")
        try:
            response = requests.get(f"{self.base_url}/api/queries/history")
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    count = data.get("count", 0)
                    print(f"✅ Retrieved {count} queries from history")
                    self.results.append({"test": "query_history", "status": "passed"})
                    return True
            print(f"❌ Failed with status {response.status_code}")
            self.results.append({"test": "query_history", "status": "failed"})
            return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.results.append(
                {"test": "query_history", "status": "error", "error": str(e)}
            )
            return False

    def test_agent_state(self) -> bool:
        """Test agent state endpoint"""
        print("\n🤖 Testing Agent State...")
        try:
            response = requests.get(f"{self.base_url}/api/agent/state")
            if response.status_code == 200:
                data = response.json()
                if data.get("success"):
                    state = data.get("state", {})
                    steps = len(state.get("steps", []))
                    print(f"✅ Agent state retrieved")
                    print(f"   Current steps: {steps}")
                    self.results.append({"test": "agent_state", "status": "passed"})
                    return True
            print(f"❌ Failed with status {response.status_code}")
            self.results.append({"test": "agent_state", "status": "failed"})
            return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.results.append(
                {"test": "agent_state", "status": "error", "error": str(e)}
            )
            return False

    def run_all_tests(self):
        """Run all tests"""
        print("=" * 60)
        print("🧪 ReAct RAG API Test Suite")
        print("=" * 60)

        tests = [
            self.test_health,
            self.test_document_upload,
            self.test_get_documents,
            self.test_query_processing,
            self.test_query_history,
            self.test_agent_state,
        ]

        passed = 0
        failed = 0

        for test in tests:
            if test():
                passed += 1
            else:
                failed += 1

        print("\n" + "=" * 60)
        print("📊 Test Results Summary")
        print("=" * 60)
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"📈 Success Rate: {(passed / (passed + failed) * 100):.1f}%")
        print("=" * 60)

        return failed == 0


def main():
    """Main entry point"""
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = BASE_URL

    print(f"Testing API at: {base_url}")

    tester = APITester(base_url)
    success = tester.run_all_tests()

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
