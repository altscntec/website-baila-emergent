#!/usr/bin/env python3
"""
Baila Dembow Backend API Testing Suite
Tests all API endpoints for the event platform
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, List, Any

class BailaDembowAPITester:
    def __init__(self, base_url="https://latinevents.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "response_data": response_data
        })

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else None
            
            if success and data and data.get("message") == "Baila Dembow API":
                self.log_test("API Root", True, "API root accessible", data)
                return True
            else:
                self.log_test("API Root", False, f"Status: {response.status_code}, Data: {data}")
                return False
        except Exception as e:
            self.log_test("API Root", False, f"Connection error: {str(e)}")
            return False

    def test_get_events(self):
        """Test GET /api/events endpoint"""
        try:
            response = requests.get(f"{self.api_url}/events", timeout=10)
            success = response.status_code == 200
            
            if success:
                events = response.json()
                if isinstance(events, list) and len(events) == 3:
                    # Validate event structure
                    required_fields = ["id", "city", "venue", "date", "time", "title", "description", "ticket_url", "status"]
                    all_valid = True
                    
                    for event in events:
                        for field in required_fields:
                            if field not in event:
                                all_valid = False
                                break
                    
                    if all_valid:
                        # Check specific events
                        event_cities = [e["city"] for e in events]
                        expected_cities = ["Amsterdam", "Leiden", "Amsterdam"]
                        
                        if event_cities == expected_cities:
                            self.log_test("GET Events", True, f"Retrieved {len(events)} events with correct structure", events)
                            return True
                        else:
                            self.log_test("GET Events", False, f"Unexpected event cities: {event_cities}")
                            return False
                    else:
                        self.log_test("GET Events", False, "Events missing required fields")
                        return False
                else:
                    self.log_test("GET Events", False, f"Expected 3 events, got {len(events) if isinstance(events, list) else 'non-list'}")
                    return False
            else:
                self.log_test("GET Events", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET Events", False, f"Error: {str(e)}")
            return False

    def test_email_subscription(self):
        """Test POST /api/subscribe endpoint"""
        test_email = f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com"
        
        try:
            # Test valid subscription
            response = requests.post(
                f"{self.api_url}/subscribe",
                json={"email": test_email, "source": "website"},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("email") == test_email and data.get("source") == "website":
                    self.log_test("Email Subscription - Valid", True, "Successfully subscribed email", data)
                    
                    # Test duplicate subscription
                    duplicate_response = requests.post(
                        f"{self.api_url}/subscribe",
                        json={"email": test_email, "source": "website"},
                        headers={"Content-Type": "application/json"},
                        timeout=10
                    )
                    
                    if duplicate_response.status_code == 400:
                        self.log_test("Email Subscription - Duplicate", True, "Correctly rejected duplicate email")
                        return True
                    else:
                        self.log_test("Email Subscription - Duplicate", False, f"Expected 400, got {duplicate_response.status_code}")
                        return False
                else:
                    self.log_test("Email Subscription - Valid", False, f"Invalid response data: {data}")
                    return False
            else:
                self.log_test("Email Subscription - Valid", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Email Subscription - Valid", False, f"Error: {str(e)}")
            return False

    def test_invalid_email_subscription(self):
        """Test POST /api/subscribe with invalid email"""
        try:
            response = requests.post(
                f"{self.api_url}/subscribe",
                json={"email": "invalid-email", "source": "website"},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            # Should return 422 for validation error
            if response.status_code == 422:
                self.log_test("Email Subscription - Invalid Email", True, "Correctly rejected invalid email format")
                return True
            else:
                self.log_test("Email Subscription - Invalid Email", False, f"Expected 422, got {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Email Subscription - Invalid Email", False, f"Error: {str(e)}")
            return False

    def test_get_subscribers(self):
        """Test GET /api/subscribers endpoint (admin)"""
        try:
            response = requests.get(f"{self.api_url}/subscribers", timeout=10)
            success = response.status_code == 200
            
            if success:
                subscribers = response.json()
                if isinstance(subscribers, list):
                    self.log_test("GET Subscribers", True, f"Retrieved {len(subscribers)} subscribers")
                    return True
                else:
                    self.log_test("GET Subscribers", False, "Response is not a list")
                    return False
            else:
                self.log_test("GET Subscribers", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("GET Subscribers", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Baila Dembow Backend API Tests")
        print(f"🌐 Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Test API connectivity first
        if not self.test_api_root():
            print("❌ API root test failed - stopping tests")
            return False
        
        # Test core endpoints
        self.test_get_events()
        self.test_email_subscription()
        self.test_invalid_email_subscription()
        self.test_get_subscribers()
        
        # Print summary
        print("=" * 60)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All backend tests passed!")
            return True
        else:
            print("⚠️  Some backend tests failed")
            return False

    def get_test_report(self):
        """Get detailed test report"""
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0,
            "test_results": self.test_results
        }

def main():
    """Main test execution"""
    tester = BailaDembowAPITester()
    success = tester.run_all_tests()
    
    # Save detailed report
    report = tester.get_test_report()
    with open("/app/backend_test_report.json", "w") as f:
        json.dump(report, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())