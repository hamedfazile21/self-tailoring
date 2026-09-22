import { MeasurementsService } from './measurements.service';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { UpdateMeasurementDto } from './dto/update-measurement.dto';
export declare class MeasurementsController {
    private readonly measurementsService;
    constructor(measurementsService: MeasurementsService);
    create(createMeasurementDto: CreateMeasurementDto): Promise<CreateMeasurementDto>;
    findAll(): Promise<import("./entities/measurement.entity").Measurement[]>;
    findOne(id: number): Promise<import("./entities/measurement.entity").Measurement>;
    update(id: number, updateMeasurementDto: UpdateMeasurementDto): Promise<import("./entities/measurement.entity").Measurement>;
    remove(id: number): Promise<string[]>;
}
