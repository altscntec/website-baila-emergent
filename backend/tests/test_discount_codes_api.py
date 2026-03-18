"""
Backend API Tests for Kingsday Discount Code System
Tests: subscribe, verify, spin, admin discount codes
"""

import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dembow-campaign.preview.emergentagent.com').rstrip('/')

class TestKingsdaySubscribe:
    """Tests for POST /api/kingsday/subscribe endpoint"""
    
    def test_subscribe_new_email_success(self):
        """New email subscription should succeed and return verification token"""
        unique_email = f"test-{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(f"{BASE_URL}/api/kingsday/subscribe", json={"email": unique_email})
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "verification_token" in data
        assert data["verified"] == False
        assert "Please check your email" in data["message"]
    
    def test_subscribe_duplicate_email_unverified(self):
        """Subscribing same email again (unverified) should return existing token"""
        unique_email = f"test-dup-{uuid.uuid4().hex[:8]}@example.com"
        
        # First subscription
        response1 = requests.post(f"{BASE_URL}/api/kingsday/subscribe", json={"email": unique_email})
        assert response1.status_code == 200
        token1 = response1.json()["verification_token"]
        
        # Second subscription (same email, unverified)
        response2 = requests.post(f"{BASE_URL}/api/kingsday/subscribe", json={"email": unique_email})
        assert response2.status_code == 200
        data = response2.json()
        assert data["verified"] == False
        # Should return same token
        assert data["verification_token"] == token1
    
    def test_subscribe_invalid_email(self):
        """Invalid email format should return 422"""
        response = requests.post(f"{BASE_URL}/api/kingsday/subscribe", json={"email": "not-an-email"})
        assert response.status_code == 422


class TestKingsdayVerify:
    """Tests for GET /api/kingsday/verify/{token} endpoint"""
    
    def test_verify_valid_token(self):
        """Valid verification token should mark user as verified"""
        unique_email = f"test-verify-{uuid.uuid4().hex[:8]}@example.com"
        
        # Subscribe
        sub_response = requests.post(f"{BASE_URL}/api/kingsday/subscribe", json={"email": unique_email})
        token = sub_response.json()["verification_token"]
        
        # Verify
        response = requests.get(f"{BASE_URL}/api/kingsday/verify/{token}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["already_verified"] == False
    
    def test_verify_already_verified(self):
        """Verifying already verified token should indicate already_verified"""
        unique_email = f"test-verify2-{uuid.uuid4().hex[:8]}@example.com"
        
        # Subscribe and verify
        sub_response = requests.post(f"{BASE_URL}/api/kingsday/subscribe", json={"email": unique_email})
        token = sub_response.json()["verification_token"]
        requests.get(f"{BASE_URL}/api/kingsday/verify/{token}")
        
        # Verify again
        response = requests.get(f"{BASE_URL}/api/kingsday/verify/{token}")
        assert response.status_code == 200
        data = response.json()
        assert data["already_verified"] == True
    
    def test_verify_invalid_token(self):
        """Invalid verification token should return 404"""
        response = requests.get(f"{BASE_URL}/api/kingsday/verify/invalid-token-12345")
        assert response.status_code == 404


class TestKingsdaySpin:
    """Tests for POST /api/kingsday/spin endpoint"""
    
    def test_spin_requires_subscription(self):
        """Spin without subscription should fail with 400"""
        unique_email = f"nosub-{uuid.uuid4().hex[:8]}@example.com"
        response = requests.post(f"{BASE_URL}/api/kingsday/spin", json={"email": unique_email})
        assert response.status_code == 400
        assert "subscribe" in response.json()["detail"].lower()
    
    def test_spin_requires_verification(self):
        """Spin without verification should fail with 400"""
        unique_email = f"noverify-{uuid.uuid4().hex[:8]}@example.com"
        
        # Subscribe but don't verify
        requests.post(f"{BASE_URL}/api/kingsday/subscribe", json={"email": unique_email})
        
        response = requests.post(f"{BASE_URL}/api/kingsday/spin", json={"email": unique_email})
        assert response.status_code == 400
        assert "verify" in response.json()["detail"].lower()
    
    def test_spin_success_after_verification(self):
        """Spin after verification should succeed"""
        unique_email = f"spin-{uuid.uuid4().hex[:8]}@example.com"
        
        # Subscribe
        sub_response = requests.post(f"{BASE_URL}/api/kingsday/subscribe", json={"email": unique_email})
        token = sub_response.json()["verification_token"]
        
        # Verify
        requests.get(f"{BASE_URL}/api/kingsday/verify/{token}")
        
        # Spin
        response = requests.post(f"{BASE_URL}/api/kingsday/spin", json={"email": unique_email})
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "prize" in data
        assert data["prize"] in ["Free Ticket", "Backstage Pass", "Weekender Ticket", "10% Discount", "Better Luck Next Time"]
    
    def test_spin_only_once_allowed(self):
        """Second spin attempt should return success=False with previous result"""
        unique_email = f"spin2-{uuid.uuid4().hex[:8]}@example.com"
        
        # Subscribe and verify
        sub_response = requests.post(f"{BASE_URL}/api/kingsday/subscribe", json={"email": unique_email})
        token = sub_response.json()["verification_token"]
        requests.get(f"{BASE_URL}/api/kingsday/verify/{token}")
        
        # First spin
        spin1 = requests.post(f"{BASE_URL}/api/kingsday/spin", json={"email": unique_email})
        assert spin1.status_code == 200
        first_prize = spin1.json()["prize"]
        
        # Second spin - should be blocked
        spin2 = requests.post(f"{BASE_URL}/api/kingsday/spin", json={"email": unique_email})
        assert spin2.status_code == 200
        data = spin2.json()
        assert data["success"] == False
        assert data["prize"] == first_prize  # Same prize returned
        assert "already" in data["message"].lower()
    
    def test_discount_code_not_returned_in_response(self):
        """When prize is 10% Discount, coupon_code should be null in response"""
        # Run multiple spins to try to hit a discount prize (6% chance)
        discount_found = False
        for i in range(30):  # Try 30 users to increase chance of hitting discount
            unique_email = f"discount-test-{i}-{uuid.uuid4().hex[:6]}@example.com"
            
            # Subscribe and verify
            sub = requests.post(f"{BASE_URL}/api/kingsday/subscribe", json={"email": unique_email})
            token = sub.json()["verification_token"]
            requests.get(f"{BASE_URL}/api/kingsday/verify/{token}")
            
            # Spin
            spin = requests.post(f"{BASE_URL}/api/kingsday/spin", json={"email": unique_email})
            data = spin.json()
            
            if data["prize"] == "10% Discount":
                discount_found = True
                # Key assertion: coupon_code should be null for discount wins
                assert data["coupon_code"] is None, "Discount code should NOT be returned in API response"
                break
            elif data["prize"] not in ["Better Luck Next Time"]:
                # Other prizes should have coupon codes
                assert data["coupon_code"] is not None
        
        if not discount_found:
            pytest.skip("No discount prize hit in 30 attempts (expected with 6% rate)")


class TestCheckEligibility:
    """Tests for GET /api/kingsday/check-eligibility endpoint"""
    
    def test_check_not_subscribed(self):
        """Not subscribed user should get not_subscribed reason"""
        unique_email = f"notsub-{uuid.uuid4().hex[:8]}@example.com"
        response = requests.get(f"{BASE_URL}/api/kingsday/check-eligibility?email={unique_email}")
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] == False
        assert data["reason"] == "not_subscribed"
    
    def test_check_not_verified(self):
        """Subscribed but not verified user should get not_verified reason"""
        unique_email = f"notveri-{uuid.uuid4().hex[:8]}@example.com"
        requests.post(f"{BASE_URL}/api/kingsday/subscribe", json={"email": unique_email})
        
        response = requests.get(f"{BASE_URL}/api/kingsday/check-eligibility?email={unique_email}")
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] == False
        assert data["reason"] == "not_verified"
    
    def test_check_eligible(self):
        """Verified user who hasn't spun should be eligible"""
        unique_email = f"eligible-{uuid.uuid4().hex[:8]}@example.com"
        sub = requests.post(f"{BASE_URL}/api/kingsday/subscribe", json={"email": unique_email})
        token = sub.json()["verification_token"]
        requests.get(f"{BASE_URL}/api/kingsday/verify/{token}")
        
        response = requests.get(f"{BASE_URL}/api/kingsday/check-eligibility?email={unique_email}")
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] == True
    
    def test_check_already_spun(self):
        """User who has spun should get already_spun reason"""
        unique_email = f"alreadyspun-{uuid.uuid4().hex[:8]}@example.com"
        sub = requests.post(f"{BASE_URL}/api/kingsday/subscribe", json={"email": unique_email})
        token = sub.json()["verification_token"]
        requests.get(f"{BASE_URL}/api/kingsday/verify/{token}")
        requests.post(f"{BASE_URL}/api/kingsday/spin", json={"email": unique_email})
        
        response = requests.get(f"{BASE_URL}/api/kingsday/check-eligibility?email={unique_email}")
        assert response.status_code == 200
        data = response.json()
        assert data["eligible"] == False
        assert data["reason"] == "already_spun"


class TestAdminDiscountCodeStats:
    """Tests for GET /api/admin/discount-codes/stats endpoint"""
    
    def test_stats_returns_counts(self):
        """Stats should return total, used, unused counts"""
        response = requests.get(f"{BASE_URL}/api/admin/discount-codes/stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "total" in data
        assert "used" in data
        assert "unused" in data
        assert isinstance(data["total"], int)
        assert isinstance(data["used"], int)
        assert isinstance(data["unused"], int)
        assert data["total"] == data["used"] + data["unused"]
    
    def test_stats_has_recent_assignments(self):
        """Stats should include recent_assignments list"""
        response = requests.get(f"{BASE_URL}/api/admin/discount-codes/stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "recent_assignments" in data
        assert isinstance(data["recent_assignments"], list)


class TestAdminDiscountCodesList:
    """Tests for GET /api/admin/discount-codes endpoint"""
    
    def test_list_all_codes(self):
        """Listing all codes should return array with code objects"""
        response = requests.get(f"{BASE_URL}/api/admin/discount-codes")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        if len(data) > 0:
            code = data[0]
            assert "code" in code
            assert "is_used" in code
            assert "id" in code
    
    def test_list_unused_codes(self):
        """Filtering by status=unused should return only unused codes"""
        response = requests.get(f"{BASE_URL}/api/admin/discount-codes?status=unused")
        assert response.status_code == 200
        data = response.json()
        
        for code in data:
            assert code["is_used"] == False
    
    def test_list_used_codes(self):
        """Filtering by status=used should return only used codes"""
        response = requests.get(f"{BASE_URL}/api/admin/discount-codes?status=used")
        assert response.status_code == 200
        data = response.json()
        
        for code in data:
            assert code["is_used"] == True


class TestAdminDiscountCodesUpload:
    """Tests for POST /api/admin/discount-codes/upload endpoint"""
    
    def test_upload_new_codes(self):
        """Uploading new codes should succeed"""
        unique_codes = [f"TEST-{uuid.uuid4().hex[:8].upper()}" for _ in range(3)]
        response = requests.post(f"{BASE_URL}/api/admin/discount-codes/upload", json={"codes": unique_codes})
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["inserted"] == 3
        assert data["skipped"] == 0
    
    def test_upload_duplicate_codes_skipped(self):
        """Uploading duplicate codes should skip them"""
        unique_code = f"TEST-DUP-{uuid.uuid4().hex[:6].upper()}"
        
        # First upload
        requests.post(f"{BASE_URL}/api/admin/discount-codes/upload", json={"codes": [unique_code]})
        
        # Second upload (same code)
        response = requests.post(f"{BASE_URL}/api/admin/discount-codes/upload", json={"codes": [unique_code]})
        assert response.status_code == 200
        data = response.json()
        assert data["skipped"] == 1
        assert data["inserted"] == 0
    
    def test_upload_empty_codes_error(self):
        """Uploading empty codes list should return 400"""
        response = requests.post(f"{BASE_URL}/api/admin/discount-codes/upload", json={"codes": []})
        assert response.status_code == 400


class TestAdminVerify:
    """Tests for POST /api/admin/verify endpoint"""
    
    def test_valid_password(self):
        """Valid admin password should return valid=True"""
        response = requests.post(f"{BASE_URL}/api/admin/verify?password=bailadembow2024")
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] == True
    
    def test_invalid_password(self):
        """Invalid admin password should return 401"""
        response = requests.post(f"{BASE_URL}/api/admin/verify?password=wrongpassword")
        assert response.status_code == 401


class TestEmailNormalization:
    """Tests for email alias abuse prevention"""
    
    def test_gmail_plus_alias_normalized(self):
        """Gmail plus aliases should be normalized to same user"""
        base_email = f"testuser{uuid.uuid4().hex[:6]}"
        email1 = f"{base_email}@gmail.com"
        email2 = f"{base_email}+promo@gmail.com"
        
        # Subscribe with base email
        sub1 = requests.post(f"{BASE_URL}/api/kingsday/subscribe", json={"email": email1})
        assert sub1.status_code == 200
        token1 = sub1.json()["verification_token"]
        
        # Subscribe with alias - should return same token
        sub2 = requests.post(f"{BASE_URL}/api/kingsday/subscribe", json={"email": email2})
        assert sub2.status_code == 200
        token2 = sub2.json()["verification_token"]
        
        # Should be same user
        assert token1 == token2
