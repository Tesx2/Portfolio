<?php
/**
 * Plugin Name: Vince Portfolio Projects
 * Description: Adds portfolio project uploads and a clean REST API for Vincent Mwangi's portfolio site.
 * Version: 0.1.0
 * Author: Vincent Mwangi
 */

if (!defined('ABSPATH')) {
    exit;
}

const VINCE_PORTFOLIO_POST_TYPE = 'vince_project';
const VINCE_PORTFOLIO_TAXONOMY = 'vince_project_category';

register_activation_hook(__FILE__, 'vince_portfolio_activate');

add_action('init', 'vince_portfolio_register_content');
add_action('init', 'vince_portfolio_register_meta');
add_action('rest_api_init', 'vince_portfolio_register_routes');
add_action('add_meta_boxes', 'vince_portfolio_add_project_fields');
add_action('save_post_' . VINCE_PORTFOLIO_POST_TYPE, 'vince_portfolio_save_project_fields');
add_action('rest_api_init', 'vince_portfolio_add_cors_headers', 15);
add_filter('manage_' . VINCE_PORTFOLIO_POST_TYPE . '_posts_columns', 'vince_portfolio_admin_columns');
add_action('manage_' . VINCE_PORTFOLIO_POST_TYPE . '_posts_custom_column', 'vince_portfolio_admin_column_content', 10, 2);

function vince_portfolio_activate() {
    vince_portfolio_register_content();
    vince_portfolio_create_default_categories();
    flush_rewrite_rules();
}

function vince_portfolio_register_content() {
    register_post_type(VINCE_PORTFOLIO_POST_TYPE, [
        'labels' => [
            'name' => 'Portfolio Projects',
            'singular_name' => 'Portfolio Project',
            'add_new_item' => 'Add New Portfolio Project',
            'edit_item' => 'Edit Portfolio Project',
        ],
        'public' => true,
        'show_in_rest' => true,
        'menu_icon' => 'dashicons-portfolio',
        'supports' => ['title', 'editor', 'excerpt', 'thumbnail', 'page-attributes'],
        'has_archive' => true,
        'rewrite' => ['slug' => 'portfolio-projects'],
    ]);

    register_taxonomy(VINCE_PORTFOLIO_TAXONOMY, VINCE_PORTFOLIO_POST_TYPE, [
        'labels' => [
            'name' => 'Project Categories',
            'singular_name' => 'Project Category',
        ],
        'public' => true,
        'hierarchical' => true,
        'show_in_rest' => true,
        'rewrite' => ['slug' => 'project-category'],
    ]);

    vince_portfolio_create_default_categories();
}

function vince_portfolio_create_default_categories() {
    $categories = [
        'Posters',
        'Logos',
        'Motion Graphics',
        'Animations',
        'Websites',
        'Publications',
        'Video Editing',
    ];

    foreach ($categories as $category) {
        if (!term_exists($category, VINCE_PORTFOLIO_TAXONOMY)) {
            wp_insert_term($category, VINCE_PORTFOLIO_TAXONOMY);
        }
    }
}

function vince_portfolio_register_meta() {
    $fields = [
        'client' => 'string',
        'subcategory' => 'string',
        'year' => 'string',
        'role' => 'string',
        'tools' => 'string',
        'challenge' => 'string',
        'solution' => 'string',
        'deliverables' => 'string',
        'result' => 'string',
        'external_url' => 'string',
        'video_url' => 'string',
        'gallery_urls' => 'string',
        'featured' => 'boolean',
    ];

    foreach ($fields as $key => $type) {
        register_post_meta(VINCE_PORTFOLIO_POST_TYPE, $key, [
            'type' => $type,
            'single' => true,
            'show_in_rest' => true,
            'sanitize_callback' => $type === 'boolean' ? 'rest_sanitize_boolean' : 'sanitize_text_field',
            'auth_callback' => function () {
                return current_user_can('edit_posts');
            },
        ]);
    }
}

function vince_portfolio_register_routes() {
    register_rest_route('vince/v1', '/projects', [
        'methods' => WP_REST_Server::READABLE,
        'permission_callback' => '__return_true',
        'callback' => 'vince_portfolio_get_projects',
        'args' => [
            'category' => [
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'featured' => [
                'sanitize_callback' => 'rest_sanitize_boolean',
            ],
            'per_page' => [
                'default' => 50,
                'sanitize_callback' => 'absint',
            ],
        ],
    ]);
}

function vince_portfolio_add_cors_headers() {
    add_filter('rest_pre_serve_request', function ($served, $result, $request, $server) {
        if (strpos($request->get_route(), '/vince/v1/projects') !== 0) {
            return $served;
        }

        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');

        return $served;
    }, 10, 4);
}

function vince_portfolio_admin_columns($columns) {
    $new_columns = [];

    foreach ($columns as $key => $label) {
        $new_columns[$key] = $label;

        if ($key === 'title') {
            $new_columns['project_category'] = 'Category';
            $new_columns['featured_project'] = 'Featured';
            $new_columns['project_year'] = 'Year';
        }
    }

    return $new_columns;
}

function vince_portfolio_admin_column_content($column, $post_id) {
    if ($column === 'project_category') {
        $terms = wp_get_post_terms($post_id, VINCE_PORTFOLIO_TAXONOMY, ['fields' => 'names']);
        echo esc_html(implode(', ', $terms));
    }

    if ($column === 'featured_project') {
        echo get_post_meta($post_id, 'featured', true) ? 'Yes' : 'No';
    }

    if ($column === 'project_year') {
        echo esc_html(get_post_meta($post_id, 'year', true));
    }
}

function vince_portfolio_add_project_fields() {
    add_meta_box(
        'vince_portfolio_project_details',
        'Project Details',
        'vince_portfolio_render_project_fields',
        VINCE_PORTFOLIO_POST_TYPE,
        'normal',
        'high'
    );
}

function vince_portfolio_render_project_fields(WP_Post $post) {
    wp_nonce_field('vince_portfolio_save_project_fields', 'vince_portfolio_project_fields_nonce');

    $fields = [
        'client' => 'Client or project owner',
        'subcategory' => 'Subcategory, for example 2D Animations',
        'year' => 'Project year',
        'role' => 'Your role',
        'tools' => 'Tools used, separated by commas',
        'external_url' => 'External project URL',
        'video_url' => 'Video URL or uploaded video URL',
        'gallery_urls' => 'Gallery image URLs, one per line',
        'challenge' => 'Challenge',
        'solution' => 'Solution',
        'deliverables' => 'Deliverables',
        'result' => 'Result or use case',
    ];

    echo '<table class="form-table" role="presentation"><tbody>';

    foreach ($fields as $key => $label) {
        $value = get_post_meta($post->ID, $key, true);
        echo '<tr>';
        echo '<th scope="row"><label for="vince_' . esc_attr($key) . '">' . esc_html($label) . '</label></th>';
        echo '<td>';

        if (in_array($key, ['challenge', 'solution', 'deliverables', 'result', 'gallery_urls'], true)) {
            echo '<textarea id="vince_' . esc_attr($key) . '" name="vince_portfolio_fields[' . esc_attr($key) . ']" rows="3" class="large-text">' . esc_textarea($value) . '</textarea>';
        } else {
            echo '<input id="vince_' . esc_attr($key) . '" name="vince_portfolio_fields[' . esc_attr($key) . ']" type="text" class="regular-text" value="' . esc_attr($value) . '">';
        }

        echo '</td>';
        echo '</tr>';
    }

    $featured = (bool) get_post_meta($post->ID, 'featured', true);
    echo '<tr>';
    echo '<th scope="row">Featured project</th>';
    echo '<td><label><input type="checkbox" name="vince_portfolio_fields[featured]" value="1" ' . checked($featured, true, false) . '> Show on the homepage featured grid</label></td>';
    echo '</tr>';

    echo '</tbody></table>';
}

function vince_portfolio_save_project_fields($post_id) {
    if (!isset($_POST['vince_portfolio_project_fields_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['vince_portfolio_project_fields_nonce'])), 'vince_portfolio_save_project_fields')) {
        return;
    }

    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    $input = isset($_POST['vince_portfolio_fields']) && is_array($_POST['vince_portfolio_fields'])
        ? wp_unslash($_POST['vince_portfolio_fields'])
        : [];

    $text_fields = ['client', 'subcategory', 'year', 'role', 'tools', 'challenge', 'solution', 'deliverables', 'result'];
    foreach ($text_fields as $key) {
        update_post_meta($post_id, $key, sanitize_text_field($input[$key] ?? ''));
    }

    update_post_meta($post_id, 'external_url', esc_url_raw($input['external_url'] ?? ''));
    update_post_meta($post_id, 'video_url', esc_url_raw($input['video_url'] ?? ''));
    update_post_meta($post_id, 'gallery_urls', sanitize_textarea_field($input['gallery_urls'] ?? ''));
    update_post_meta($post_id, 'featured', !empty($input['featured']) ? '1' : '0');
}

function vince_portfolio_get_projects(WP_REST_Request $request) {
    $args = [
        'post_type' => VINCE_PORTFOLIO_POST_TYPE,
        'post_status' => 'publish',
        'posts_per_page' => min(max((int) $request['per_page'], 1), 100),
        'orderby' => ['menu_order' => 'ASC', 'date' => 'DESC'],
    ];

    if (!empty($request['category'])) {
        $args['tax_query'] = [[
            'taxonomy' => VINCE_PORTFOLIO_TAXONOMY,
            'field' => 'name',
            'terms' => $request['category'],
        ]];
    }

    if ($request->has_param('featured')) {
        $args['meta_query'] = [[
            'key' => 'featured',
            'value' => $request['featured'] ? '1' : '0',
        ]];
    }

    $query = new WP_Query($args);
    $projects = array_map('vince_portfolio_format_project', $query->posts);

    return rest_ensure_response($projects);
}

function vince_portfolio_format_project(WP_Post $post) {
    $category_names = wp_get_post_terms($post->ID, VINCE_PORTFOLIO_TAXONOMY, ['fields' => 'names']);
    $featured_image = get_the_post_thumbnail_url($post->ID, 'large');
    $tools = get_post_meta($post->ID, 'tools', true);
    $gallery_urls = get_post_meta($post->ID, 'gallery_urls', true);

    return [
        'id' => $post->ID,
        'title' => get_the_title($post),
        'slug' => $post->post_name,
        'category' => $category_names[0] ?? '',
        'subcategory' => get_post_meta($post->ID, 'subcategory', true),
        'summary' => get_the_excerpt($post),
        'featuredImage' => $featured_image ?: '',
        'gallery' => array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $gallery_urls)))),
        'videoUrl' => get_post_meta($post->ID, 'video_url', true),
        'client' => get_post_meta($post->ID, 'client', true),
        'year' => get_post_meta($post->ID, 'year', true),
        'role' => get_post_meta($post->ID, 'role', true),
        'tools' => array_filter(array_map('trim', explode(',', $tools))),
        'challenge' => get_post_meta($post->ID, 'challenge', true),
        'solution' => get_post_meta($post->ID, 'solution', true),
        'deliverables' => get_post_meta($post->ID, 'deliverables', true),
        'result' => get_post_meta($post->ID, 'result', true),
        'externalUrl' => get_post_meta($post->ID, 'external_url', true),
        'featured' => (bool) get_post_meta($post->ID, 'featured', true),
        'order' => (int) $post->menu_order,
        'url' => get_permalink($post),
    ];
}
