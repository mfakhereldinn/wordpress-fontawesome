<?php
namespace FortAwesome;

require_once trailingslashit( dirname(__FILE__) ) . '../defines.php';
require_once trailingslashit( dirname(__FILE__) ) . 'class-fontawesome.php';

/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 */
class FontAwesome_Activator {

	/**
	 * Initializes plugin options only if they are empty.
	 *
	 * @since 4.0.0
	 * @throws FontAwesome_NoReleasesException
	 */
	public static function activate() {
		self::initialize();
	}

	/**
	 * Initializes plugin options with defaults only if they are empty.
	 * Otherwise, it leaves alone options that are already present.
	 * 
	 * Sets default user options. Will attempt to get the latest available version,
	 * which requires access to the Font Awesome API server. Throws FontAwesome_NoReleasesException
	 * when that request fails.
	 * 
	 * @param bool $force if true, overwrite any existing options with defaults
	 *
	 * @since 4.0.0
	 * @throws FontAwesome_NoReleasesException
	 */
	public static function initialize($force = FALSE) {
		if( $force || ! get_option( FontAwesome::OPTIONS_KEY ) ) {
			self::initialize_user_options();
		}

		if( $force || ! get_option( FontAwesome::UNREGISTERED_CLIENTS_OPTIONS_KEY ) ) {
			self::initialize_unregistered_clients_options();
		}
	}

	private static function initialize_user_options() {
		$version = fa()->get_latest_version();
		$options = array_merge( FontAwesome::DEFAULT_USER_OPTIONS, [ 'version' => $version ] );
		update_option( FontAwesome::OPTIONS_KEY, $options );
	}

	private static function initialize_unregistered_clients_options() {
		update_option( FontAwesome::UNREGISTERED_CLIENTS_OPTIONS_KEY, array() );
	}
}

