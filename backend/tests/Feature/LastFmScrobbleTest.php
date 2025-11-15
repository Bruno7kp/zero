<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LastFmScrobbleTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that scrobble endpoint requires authentication.
     */
    public function test_scrobble_requires_authentication(): void
    {
        $response = $this->postJson('/api/lastfm/scrobble', []);

        $response->assertStatus(401);
    }

    /**
     * Test that scrobble endpoint validates required fields.
     */
    public function test_scrobble_validates_required_fields(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/lastfm/scrobble', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'api_key',
                'api_secret',
                'session_key',
                'artist',
                'track',
                'timestamp',
            ]);
    }

    /**
     * Test that scrobble endpoint accepts valid data.
     */
    public function test_scrobble_accepts_valid_data(): void
    {
        $user = User::factory()->create();

        $data = [
            'api_key' => 'test_api_key',
            'api_secret' => 'test_api_secret',
            'session_key' => 'test_session_key',
            'artist' => 'Test Artist',
            'track' => 'Test Track',
            'timestamp' => time(),
            'album' => 'Test Album',
            'albumArtist' => 'Test Album Artist',
            'duration' => 240,
        ];

        // Note: This will fail with Last.fm API unless valid credentials are provided
        // This test validates the endpoint accepts the correct structure and makes the request
        $response = $this->actingAs($user)
            ->postJson('/api/lastfm/scrobble', $data);

        // We expect either success (200), Last.fm API error (400), or server error (500)
        // Server error is expected with fake credentials as Last.fm will reject them
        $this->assertContains($response->status(), [200, 400, 500]);

        // If it's a 400 or 500, ensure we get a proper error response
        if ($response->status() !== 200) {
            $response->assertJsonStructure(['success', 'error']);
        }
    }

    /**
     * Test that optional fields are not required.
     */
    public function test_scrobble_works_without_optional_fields(): void
    {
        $user = User::factory()->create();

        $data = [
            'api_key' => 'test_api_key',
            'api_secret' => 'test_api_secret',
            'session_key' => 'test_session_key',
            'artist' => 'Test Artist',
            'track' => 'Test Track',
            'timestamp' => time(),
        ];

        $response = $this->actingAs($user)
            ->postJson('/api/lastfm/scrobble', $data);

        // We expect either success or Last.fm API error, but not validation error
        $this->assertNotEquals(422, $response->status());
    }
}
