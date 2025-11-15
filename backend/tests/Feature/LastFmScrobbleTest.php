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
        $user = User::factory()->create([
            'lastfm_session_key' => 'test_session_key',
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/lastfm/scrobble', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
                'artist',
                'track',
                'timestamp',
            ]);
    }

    /**
     * Test that scrobble requires Last.fm connection.
     */
    public function test_scrobble_requires_lastfm_connection(): void
    {
        $user = User::factory()->create();

        $data = [
            'artist' => 'Test Artist',
            'track' => 'Test Track',
            'timestamp' => time(),
        ];

        $response = $this->actingAs($user)
            ->postJson('/api/lastfm/scrobble', $data);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'error' => 'Last.fm account not connected. Please connect your Last.fm account first.',
            ]);
    }

    /**
     * Test that optional fields are not required.
     */
    public function test_scrobble_works_without_optional_fields(): void
    {
        $user = User::factory()->create([
            'lastfm_session_key' => 'test_session_key',
        ]);

        $data = [
            'artist' => 'Test Artist',
            'track' => 'Test Track',
            'timestamp' => time(),
        ];

        $response = $this->actingAs($user)
            ->postJson('/api/lastfm/scrobble', $data);

        // We expect either success or Last.fm API error, but not validation error
        $this->assertNotEquals(422, $response->status());
    }

    /**
     * Test Last.fm connection status endpoint.
     */
    public function test_lastfm_status_returns_connection_state(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/lastfm/status');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'connected',
                'username',
            ]);
    }

    /**
     * Test Last.fm disconnect endpoint.
     */
    public function test_lastfm_disconnect_clears_session_key(): void
    {
        $user = User::factory()->create([
            'lastfm_session_key' => 'test_session_key',
            'lastfm_username' => 'test_user',
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/lastfm/disconnect');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $user->refresh();
        $this->assertNull($user->lastfm_session_key);
        $this->assertNull($user->lastfm_username);
    }
}
