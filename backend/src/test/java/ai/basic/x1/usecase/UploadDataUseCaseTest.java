package ai.basic.x1.usecase;

import ai.basic.x1.entity.enums.DatasetTypeEnum;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertTrue;

class UploadDataUseCaseTest {

    @TempDir
    Path tempDir;

    @Test
    void lidarFusionImportAcceptsRadarPointCloudDirectory() throws Exception {
        var useCase = new UploadDataUseCase();
        var radarDir = Files.createDirectory(tempDir.resolve("radar_point_cloud_0"));

        var accepted = (Boolean) ReflectionTestUtils.invokeMethod(
                useCase,
                "validateFilenameByType",
                radarDir.toFile(),
                DatasetTypeEnum.LIDAR_FUSION);

        assertTrue(accepted, "radar_point_cloud_* directory should be accepted for point cloud datasets");
    }
}
